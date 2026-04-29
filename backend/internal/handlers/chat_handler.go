package handlers

import (
	"backend/internal/middleware"
	"backend/internal/models"
	"backend/internal/services/chat"
	"encoding/json"
	"errors"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type ChatHandler struct {
	chatService chat.Service
}

func NewChatHandler(chatService chat.Service) *ChatHandler {
	return &ChatHandler{chatService: chatService}
}

type sendChatMessageRequest struct {
	SessionID *uuid.UUID `json:"session_id"`
	Content   string     `json:"content"`
}

// SendMessage POST /api/v1/chat/message
func (h *ChatHandler) SendMessage(c *fiber.Ctx) error {
	var req sendChatMessageRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	var userID *uuid.UUID
	if uid, ok := middleware.TryGetUserID(c); ok {
		userID = &uid
	}

	msg, sid, err := h.chatService.SendMessage(c.Context(), req.SessionID, userID, req.Content)
	if err != nil {
		switch {
		case errors.Is(err, chat.ErrEmptyMessage):
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Message content is required"})
		case errors.Is(err, chat.ErrSessionNotFound):
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Session not found"})
		case errors.Is(err, chat.ErrForbidden):
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Forbidden"})
		case errors.Is(err, chat.ErrAnthropicKeyMissing):
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{"error": "Chat service is not configured"})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}
	}

	meta := chatMessageMetadataResponse([]byte(msg.Metadata))
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": fiber.Map{
			"id":        msg.ID,
			"role":      msg.Role,
			"content":   msg.Content,
			"metadata":  meta,
			"created_at": msg.CreatedAt,
		},
		"session_id": sid,
	})
}

func chatMessageMetadataResponse(raw []byte) fiber.Map {
	if len(raw) == 0 {
		return nil
	}
	var m models.ChatMessageMetadata
	if err := json.Unmarshal(raw, &m); err != nil {
		return nil
	}
	out := fiber.Map{}
	if len(m.ReferencedAttractions) > 0 {
		out["referenced_attractions"] = m.ReferencedAttractions
	}
	if len(m.ReferencedTours) > 0 {
		out["referenced_tours"] = m.ReferencedTours
	}
	if m.SuggestedAction != "" {
		out["suggested_action"] = m.SuggestedAction
	}
	if len(out) == 0 {
		return nil
	}
	return out
}

// ListSessions GET /api/v1/chat/sessions (authenticated)
func (h *ChatHandler) ListSessions(c *fiber.Ctx) error {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}
	sessions, err := h.chatService.ListSessions(c.Context(), userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to list sessions"})
	}
	out := make([]fiber.Map, 0, len(sessions))
	for _, s := range sessions {
		out = append(out, fiber.Map{
			"id":         s.ID,
			"title":      s.Title,
			"created_at": s.CreatedAt,
			"updated_at": s.UpdatedAt,
		})
	}
	return c.JSON(fiber.Map{"sessions": out})
}

// CreateSession POST /api/v1/chat/session
func (h *ChatHandler) CreateSession(c *fiber.Ctx) error {
	var userID *uuid.UUID
	if uid, ok := middleware.TryGetUserID(c); ok {
		userID = &uid
	}
	sess, err := h.chatService.CreateSession(c.Context(), userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create session"})
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"session_id": sess.ID,
	})
}

// GetHistory GET /api/v1/chat/history/:session_id
func (h *ChatHandler) GetHistory(c *fiber.Ctx) error {
	sid, err := uuid.Parse(c.Params("session_id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid session ID"})
	}
	var userID *uuid.UUID
	if uid, ok := middleware.TryGetUserID(c); ok {
		userID = &uid
	}
	msgs, err := h.chatService.GetHistory(c.Context(), sid, userID)
	if err != nil {
		if errors.Is(err, chat.ErrSessionNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Session not found"})
		}
		if errors.Is(err, chat.ErrForbidden) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Forbidden"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to load history"})
	}
	out := make([]fiber.Map, 0, len(msgs))
	for _, m := range msgs {
		out = append(out, fiber.Map{
			"id":         m.ID,
			"session_id": m.SessionID,
			"role":       m.Role,
			"content":    m.Content,
			"metadata":   chatMessageMetadataResponse([]byte(m.Metadata)),
			"created_at": m.CreatedAt,
		})
	}
	return c.JSON(fiber.Map{"messages": out})
}

// DeleteSession DELETE /api/v1/chat/session/:session_id
func (h *ChatHandler) DeleteSession(c *fiber.Ctx) error {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}
	sid, err := uuid.Parse(c.Params("session_id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid session ID"})
	}
	if err := h.chatService.DeleteSession(c.Context(), sid, userID); err != nil {
		if errors.Is(err, chat.ErrSessionNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Session not found"})
		}
		if errors.Is(err, chat.ErrForbidden) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Forbidden"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to delete session"})
	}
	return c.JSON(fiber.Map{"message": "Session deleted"})
}
