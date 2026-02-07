package handlers

import (
	"backend/internal/models"
	"backend/internal/repository"
	"backend/internal/services/attraction"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
)

type AttractionHandler struct {
	attractionService attraction.AttractionService
}

func NewAttractionHandler(attractionService attraction.AttractionService) *AttractionHandler {
	return &AttractionHandler{
		attractionService: attractionService,
	}
}

type LocalizedField map[string]string

type AttractionResponse struct {
	ID                int               `json:"id"`
	Name              LocalizedField    `json:"name"`
	Description       LocalizedField    `json:"description"`
	City              LocalizedField    `json:"city"`
	Address           LocalizedField    `json:"address"`
	Country           LocalizedField    `json:"country"`
	Latitude          *float64          `json:"latitude,omitempty"`
	Longitude         *float64          `json:"longitude,omitempty"`
	Images            models.ImageArray `json:"images"`
	AverageRating     *float64          `json:"average_rating,omitempty"`
	TotalRatings      *int              `json:"total_ratings,omitempty"`
	TotalViews        *int              `json:"total_views,omitempty"`
	ReviewRatingCount map[string]int    `json:"review_rating_count"`
	Categories        []models.Category `json:"categories,omitempty"`
	CreatedAt         string            `json:"created_at"`
}

type AttractionListResponse struct {
	Attractions []AttractionResponse `json:"attractions"`
	Total       int64                `json:"total"`
	Limit       int                  `json:"limit"`
	Offset      int                  `json:"offset"`
}

// ListAttractions handles listing attractions with pagination and filtering
// GET /api/v1/attractions
func (h *AttractionHandler) ListAttractions(c *fiber.Ctx) error {
	// Get query parameters
	limitStr := c.Query("limit", "20")
	offsetStr := c.Query("offset", "0")
	city := c.Query("city", "")
	search := c.Query("search", "")

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100 // Max limit
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	// Build filter
	filter := &repository.AttractionFilter{}

	if city != "" {
		filter.City = &city
	}

	if search != "" {
		filter.Search = &search
	}

	// Parse category IDs if provided (comma-separated)
	categoryIDsStr := c.Query("category_ids", "")
	if categoryIDsStr != "" {
		categoryIDStrs := strings.Split(categoryIDsStr, ",")
		for _, idStr := range categoryIDStrs {
			if id, err := strconv.Atoi(strings.TrimSpace(idStr)); err == nil {
				filter.CategoryIDs = append(filter.CategoryIDs, id)
			}
		}
	}

	// Get attractions
	attractions, total, err := h.attractionService.List(c.Context(), filter, limit, offset)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch attractions",
		})
	}

	// Convert to response format
	var attractionResponses []AttractionResponse
	for _, attr := range attractions {
		attractionResponses = append(attractionResponses, AttractionResponse{
			ID:                attr.ID,
			Name:              LocalizedField(attr.Name),
			Description:       LocalizedField(attr.Description),
			City:              LocalizedField(attr.City),
			Address:           LocalizedField(attr.Address),
			Country:           LocalizedField(attr.Country),
			Latitude:          attr.Latitude,
			Longitude:         attr.Longitude,
			Images:            attr.Images,
			AverageRating:     attr.AverageRating,
			TotalRatings:      attr.TotalRatings,
			TotalViews:        attr.TotalViews,
			ReviewRatingCount: map[string]int(attr.ReviewRatingCount),
			Categories:        attr.Categories,
			CreatedAt:         attr.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		})
	}

	return c.Status(fiber.StatusOK).JSON(AttractionListResponse{
		Attractions: attractionResponses,
		Total:       total,
		Limit:       limit,
		Offset:      offset,
	})
}

// GetAttraction handles getting a single attraction by ID
// GET /api/v1/attractions/:id
func (h *AttractionHandler) GetAttraction(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid attraction ID",
		})
	}

	attr, err := h.attractionService.GetByID(c.Context(), id)
	if err != nil {
		if err == attraction.ErrAttractionNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Attraction not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch attraction",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"attraction": AttractionResponse{
			ID:                attr.ID,
			Name:              LocalizedField(attr.Name),
			Description:       LocalizedField(attr.Description),
			City:              LocalizedField(attr.City),
			Address:           LocalizedField(attr.Address),
			Country:           LocalizedField(attr.Country),
			Latitude:          attr.Latitude,
			Longitude:         attr.Longitude,
			Images:            attr.Images,
			AverageRating:     attr.AverageRating,
			TotalRatings:      attr.TotalRatings,
			TotalViews:        attr.TotalViews,
			ReviewRatingCount: map[string]int(attr.ReviewRatingCount),
			Categories:        attr.Categories,
			CreatedAt:         attr.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		},
	})
}
