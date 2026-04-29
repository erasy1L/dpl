package chat

import (
	"backend/internal/models"
	"backend/internal/repository"
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"regexp"
	"strconv"
	"sort"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

const (
	anthropicURL      = "https://api.anthropic.com/v1/messages"
	anthropicVersion   = "2023-06-01"
	anthropicModel     = "claude-sonnet-4-20250514"
	maxHistoryMessages = 20
	maxTokens          = 1024
)

var (
	ErrAnthropicKeyMissing = errors.New("ANTHROPIC_API_KEY is not set")
	ErrSessionNotFound     = errors.New("chat session not found")
	ErrForbidden           = errors.New("forbidden")
	ErrEmptyMessage        = errors.New("message content is empty")

	reAttraction = regexp.MustCompile(`\[ATTRACTION:(\d+):([^\]]*)\]`)
	reTour       = regexp.MustCompile(`\[TOUR:(\d+):([^\]]*)\]`)
	reBookTour   = regexp.MustCompile(`\[BOOK_TOUR:(\d+):([^\]]*)\]`)
)

var kzCities = []string{
	"Almaty", "Astana", "Nur-Sultan", "Shymkent", "Karaganda", "Aktobe",
	"Taraz", "Pavlodar", "Oskemen", "Ust-Kamenogorsk", "Atyrau", "Kostanay",
	"Kyzylorda", "Petropavl", "Semey", "Oral", "Aktau", "Turkestan",
}

type Service interface {
	CreateSession(ctx context.Context, userID *uuid.UUID) (*models.ChatSession, error)
	SendMessage(ctx context.Context, sessionID *uuid.UUID, userID *uuid.UUID, content string) (*models.ChatMessage, uuid.UUID, error)
	GetHistory(ctx context.Context, sessionID uuid.UUID, userID *uuid.UUID) ([]models.ChatMessage, error)
	DeleteSession(ctx context.Context, sessionID uuid.UUID, userID uuid.UUID) error
	ListSessions(ctx context.Context, userID uuid.UUID) ([]models.ChatSession, error)
}

type service struct {
	chatRepo   repository.ChatRepository
	ctxRepo    *repository.ChatContextRepository
	httpClient *http.Client
}

func NewService(chatRepo repository.ChatRepository, db *gorm.DB) Service {
	return &service{
		chatRepo:   chatRepo,
		ctxRepo:    repository.NewChatContextRepository(db),
		httpClient: &http.Client{Timeout: 120 * time.Second},
	}
}

func (s *service) CreateSession(ctx context.Context, userID *uuid.UUID) (*models.ChatSession, error) {
	sess := &models.ChatSession{
		ID:        uuid.New(),
		UserID:    userID,
		Title:     "New conversation",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	if err := s.chatRepo.CreateSession(ctx, sess); err != nil {
		return nil, err
	}
	return sess, nil
}

func (s *service) canAccessSession(sess *models.ChatSession, userID *uuid.UUID) bool {
	if sess.UserID == nil {
		return true
	}
	if userID == nil {
		return false
	}
	return *sess.UserID == *userID
}

func (s *service) DeleteSession(ctx context.Context, sessionID uuid.UUID, userID uuid.UUID) error {
	sess, err := s.chatRepo.GetSession(ctx, sessionID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrSessionNotFound
		}
		return err
	}
	if sess.UserID == nil || *sess.UserID != userID {
		return ErrForbidden
	}
	return s.chatRepo.DeleteSession(ctx, sessionID)
}

func (s *service) ListSessions(ctx context.Context, userID uuid.UUID) ([]models.ChatSession, error) {
	return s.chatRepo.ListSessionsByUser(ctx, userID, 50)
}

func (s *service) GetHistory(ctx context.Context, sessionID uuid.UUID, _ *uuid.UUID) ([]models.ChatMessage, error) {
	_, err := s.chatRepo.GetSession(ctx, sessionID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrSessionNotFound
		}
		return nil, err
	}
	// Read history with only the session UUID (stored client-side). SendMessage still enforces canAccessSession.
	return s.chatRepo.ListRecentMessages(ctx, sessionID, 100)
}

func detectCity(msg string) string {
	lower := strings.ToLower(msg)
	for _, c := range kzCities {
		if strings.Contains(lower, strings.ToLower(c)) {
			return c
		}
	}
	return ""
}

func (s *service) buildDBContext(ctx context.Context, userMsg string) string {
	lower := strings.ToLower(userMsg)
	var attr []models.Attraction
	var tours []models.Tour
	seenA := map[int]struct{}{}
	seenT := map[int]struct{}{}

	addAttr := func(list []models.Attraction) {
		for _, a := range list {
			if _, ok := seenA[a.ID]; ok {
				continue
			}
			seenA[a.ID] = struct{}{}
			attr = append(attr, a)
		}
	}
	addTours := func(list []models.Tour) {
		for _, t := range list {
			if _, ok := seenT[t.ID]; ok {
				continue
			}
			seenT[t.ID] = struct{}{}
			tours = append(tours, t)
		}
	}

	if city := detectCity(userMsg); city != "" {
		list, _ := s.ctxRepo.AttractionsTopByCity(ctx, city, 5)
		addAttr(list)
		f := models.TourFilter{City: &city}
		tlist, _ := s.ctxRepo.ToursListActive(ctx, &f, 8)
		addTours(tlist)
	}

	if strings.Contains(lower, "tour") || strings.Contains(lower, "экскурс") || strings.Contains(lower, "тур") {
		tlist, _ := s.ctxRepo.ToursListActive(ctx, nil, 10)
		addTours(tlist)
	}

	if strings.Contains(lower, "book") || strings.Contains(lower, "booking") || strings.Contains(lower, "plan") ||
		strings.Contains(lower, "бронь") || strings.Contains(lower, "план") {
		tlist, _ := s.ctxRepo.ToursListActive(ctx, nil, 12)
		addTours(tlist)
	}

	catKeywords := map[string]string{
		"museum":    "museum",
		"музей":     "museum",
		"nature":    "nature",
		"природ":    "nature",
		"mountain":  "mountain",
		"adventure": "adventure",
		"парк":      "park",
		"lake":      "lake",
		"озер":      "lake",
	}
	for kw, dbkw := range catKeywords {
		if strings.Contains(lower, kw) {
			list, _ := s.ctxRepo.AttractionsByCategoryKeyword(ctx, dbkw, 8)
			addAttr(list)
			break
		}
	}

	if strings.Contains(lower, "attraction") || strings.Contains(lower, "visit") || strings.Contains(lower, "достопримечатель") {
		term := strings.TrimSpace(userMsg)
		if len(term) > 80 {
			term = term[:80]
		}
		if len(term) >= 3 {
			list, _ := s.ctxRepo.AttractionsSearchName(ctx, term, 6)
			addAttr(list)
		}
	}

	if len(attr) == 0 && len(tours) == 0 {
		list, _ := s.ctxRepo.AttractionsTopByCity(ctx, "Almaty", 5)
		addAttr(list)
		tlist, _ := s.ctxRepo.ToursListActive(ctx, nil, 6)
		addTours(tlist)
	}

	tourTotal, _ := s.ctxRepo.CountActiveTours(ctx)
	attrTotal, _ := s.ctxRepo.CountAttractions(ctx)

	return fmt.Sprintf(
		"## Database summary (authoritative counts — use these for \"how many\" questions):\n"+
			"- Active tours in catalog: %d\n"+
			"- Attractions in catalog: %d\n\n"+
			"## Sample for recommendations (not a full list — do not infer totals from this):\n\n"+
			"### Attractions sample:\n%s\n\n### Tours sample:\n%s",
		tourTotal,
		attrTotal,
		repository.FormatAttractionsContext(attr),
		repository.FormatToursContext(tours),
	)
}

const systemPromptPrefix = `You are TourKZ Assistant, a friendly and knowledgeable AI travel guide specializing in Kazakhstan tourism.

Your capabilities:
- Recommend attractions, tours, and destinations across Kazakhstan
- Help plan multi-day itineraries
- Answer questions about travel logistics, best seasons, costs
- Suggest bookable tours when relevant

Rules:
- Detect the user's language from their message and respond in the same language (support English, Russian, Kazakh)
- When referencing specific attractions, include them as: [ATTRACTION:id:name]
- When referencing specific tours, include them as: [TOUR:id:name]
- When a user seems ready to book, suggest specific tours with prices and link format: [BOOK_TOUR:id:name]
- Be concise but informative. Use markdown formatting for readability.
- If you don't have specific data about something, say so honestly rather than making things up.
- Prices are in KZT (Kazakhstani Tenge). You can mention approximate USD equivalents.
- For counts (how many tours, how many attractions), use only the numbers in "Database summary". The sample lists are truncated for context size; never treat the number of lines there as the total.

Available context about attractions and tours is provided below. Only reference specific items by ID from the sample lists when recommending; use Database summary for totals.

`

type anthropicRequest struct {
	Model     string              `json:"model"`
	MaxTokens int                 `json:"max_tokens"`
	System    string              `json:"system"`
	Messages  []anthropicMsg      `json:"messages"`
}

type anthropicMsg struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type anthropicResponse struct {
	Content []struct {
		Type string `json:"type"`
		Text string `json:"text"`
	} `json:"content"`
	Error *struct {
		Message string `json:"message"`
		Type    string `json:"type"`
	} `json:"error"`
}

func parseMarkers(text string) models.ChatMessageMetadata {
	meta := models.ChatMessageMetadata{}
	seenA := map[int]struct{}{}
	seenT := map[int]struct{}{}

	addInt := func(m map[int]struct{}, slice *[]int, id int) {
		if _, ok := m[id]; ok {
			return
		}
		m[id] = struct{}{}
		*slice = append(*slice, id)
	}

	for _, m := range reAttraction.FindAllStringSubmatch(text, -1) {
		if id, err := strconv.Atoi(m[1]); err == nil && id > 0 {
			addInt(seenA, &meta.ReferencedAttractions, id)
		}
	}
	for _, m := range reTour.FindAllStringSubmatch(text, -1) {
		if id, err := strconv.Atoi(m[1]); err == nil && id > 0 {
			addInt(seenT, &meta.ReferencedTours, id)
		}
	}
	for _, m := range reBookTour.FindAllStringSubmatch(text, -1) {
		if id, err := strconv.Atoi(m[1]); err == nil && id > 0 {
			addInt(seenT, &meta.ReferencedTours, id)
		}
	}
	if len(reBookTour.FindAllString(text, -1)) > 0 {
		meta.SuggestedAction = "view_tour"
	}
	sort.Ints(meta.ReferencedAttractions)
	sort.Ints(meta.ReferencedTours)
	return meta
}

func (s *service) callAnthropic(ctx context.Context, system string, history []models.ChatMessage, userContent string) (string, error) {
	key := os.Getenv("ANTHROPIC_API_KEY")
	if key == "" {
		return "", ErrAnthropicKeyMissing
	}
	msgs := make([]anthropicMsg, 0, len(history)+1)
	for _, m := range history {
		role := m.Role
		if role != "user" && role != "assistant" {
			continue
		}
		msgs = append(msgs, anthropicMsg{Role: role, Content: m.Content})
	}
	msgs = append(msgs, anthropicMsg{Role: "user", Content: userContent})

	body, err := json.Marshal(anthropicRequest{
		Model:     anthropicModel,
		MaxTokens: maxTokens,
		System:    system,
		Messages:  msgs,
	})
	if err != nil {
		return "", err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, anthropicURL, bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", key)
	req.Header.Set("anthropic-version", anthropicVersion)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	raw, _ := io.ReadAll(resp.Body)
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", fmt.Errorf("anthropic API error: %s: %s", resp.Status, string(raw))
	}
	var ar anthropicResponse
	if err := json.Unmarshal(raw, &ar); err != nil {
		return "", err
	}
	if ar.Error != nil {
		return "", fmt.Errorf("anthropic: %s", ar.Error.Message)
	}
	var out strings.Builder
	for _, block := range ar.Content {
		if block.Type == "text" {
			out.WriteString(block.Text)
		}
	}
	return strings.TrimSpace(out.String()), nil
}

func (s *service) SendMessage(ctx context.Context, sessionID *uuid.UUID, userID *uuid.UUID, content string) (*models.ChatMessage, uuid.UUID, error) {
	content = strings.TrimSpace(content)
	if content == "" {
		return nil, uuid.Nil, ErrEmptyMessage
	}

	var sid uuid.UUID
	var sess *models.ChatSession
	var err error

	if sessionID == nil || *sessionID == uuid.Nil {
		sess, err = s.CreateSession(ctx, userID)
		if err != nil {
			return nil, uuid.Nil, err
		}
		sid = sess.ID
	} else {
		sid = *sessionID
		sess, err = s.chatRepo.GetSession(ctx, sid)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, uuid.Nil, ErrSessionNotFound
			}
			return nil, uuid.Nil, err
		}
		if !s.canAccessSession(sess, userID) {
			return nil, uuid.Nil, ErrForbidden
		}
	}

	history, err := s.chatRepo.ListRecentMessages(ctx, sid, maxHistoryMessages)
	if err != nil {
		return nil, uuid.Nil, err
	}

	dbContext := s.buildDBContext(ctx, content)
	system := systemPromptPrefix + dbContext

	assistantText, err := s.callAnthropic(ctx, system, history, content)
	if err != nil {
		return nil, uuid.Nil, err
	}

	if sess.Title == "" || sess.Title == "New conversation" {
		title := content
		r := []rune(title)
		if len(r) > 60 {
			title = string(r[:60]) + "…"
		}
		sess.Title = title
	}
	sess.UpdatedAt = time.Now()
	_ = s.chatRepo.UpdateSession(ctx, sess)

	userMsg := &models.ChatMessage{
		ID:        uuid.New(),
		SessionID: sid,
		UserID:    userID,
		Role:      "user",
		Content:   content,
		CreatedAt: time.Now(),
	}
	if err := s.chatRepo.CreateMessage(ctx, userMsg); err != nil {
		return nil, uuid.Nil, err
	}

	meta := parseMarkers(assistantText)
	metaJSON, _ := json.Marshal(meta)

	asstMsg := &models.ChatMessage{
		ID:        uuid.New(),
		SessionID: sid,
		UserID:    userID,
		Role:      "assistant",
		Content:   assistantText,
		Metadata:  datatypes.JSON(metaJSON),
		CreatedAt: time.Now(),
	}
	if err := s.chatRepo.CreateMessage(ctx, asstMsg); err != nil {
		return nil, uuid.Nil, err
	}

	return asstMsg, sid, nil
}
