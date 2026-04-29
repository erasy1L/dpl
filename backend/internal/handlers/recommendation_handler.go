package handlers

import (
	"backend/internal/middleware"
	"backend/internal/services/recommendation"
	"errors"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

type RecommendationHandler struct {
	recommendationService recommendation.Service
}

func NewRecommendationHandler(recommendationService recommendation.Service) *RecommendationHandler {
	return &RecommendationHandler{
		recommendationService: recommendationService,
	}
}

// GetRecommendations - GET /api/v1/recommendations — main attraction feed for the logged-in user
func (h *RecommendationHandler) GetRecommendations(c *fiber.Ctx) error {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	limit, _ := strconv.Atoi(c.Query("limit", "24"))
	if limit <= 0 || limit > 50 {
		limit = 24
	}

	city := c.Query("city")
	var cityPtr *string
	if city != "" {
		cityPtr = &city
	}

	attractions, reason, err := h.recommendationService.GetUnified(c.Context(), userID, cityPtr, limit)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch recommendations",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"recommendations": attractions,
		"reason":          reason,
	})
}

// GetSimilar - GET /api/v1/recommendations/similar/:id
func (h *RecommendationHandler) GetSimilar(c *fiber.Ctx) error {
	// Get attraction ID from URL
	attractionID, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid attraction ID",
		})
	}

	// Get limit from query
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	if limit <= 0 || limit > 50 {
		limit = 10
	}

	// Get similar attractions
	attractions, reason, err := h.recommendationService.GetSimilar(c.Context(), attractionID, limit)
	if err != nil {
		if errors.Is(err, recommendation.ErrAttractionNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Attraction not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch recommendations",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"attractions": attractions,
		"reason":      reason,
	})
}

// GetPersonalized - GET /api/v1/recommendations/personalized
func (h *RecommendationHandler) GetPersonalized(c *fiber.Ctx) error {
	// Get user ID from context
	userID, ok := middleware.GetUserID(c)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	// Get limit from query
	limit, _ := strconv.Atoi(c.Query("limit", "12"))
	if limit <= 0 || limit > 50 {
		limit = 12
	}

	// Get personalized recommendations
	attractions, reason, err := h.recommendationService.GetPersonalized(c.Context(), userID, limit)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch recommendations",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"attractions": attractions,
		"reason":      reason,
	})
}

// GetTrending - GET /api/v1/recommendations/trending
func (h *RecommendationHandler) GetTrending(c *fiber.Ctx) error {
	// Get city from query
	city := c.Query("city")
	var cityPtr *string
	if city != "" {
		cityPtr = &city
	}

	// Get limit from query
	limit, _ := strconv.Atoi(c.Query("limit", "12"))
	if limit <= 0 || limit > 50 {
		limit = 12
	}

	// Get trending attractions
	attractions, reason, err := h.recommendationService.GetTrending(c.Context(), cityPtr, limit)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch recommendations",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"attractions": attractions,
		"reason":      reason,
	})
}

// GetContentBased - GET /api/v1/recommendations/content-based
func (h *RecommendationHandler) GetContentBased(c *fiber.Ctx) error {
	// Get user ID from context
	userID, ok := middleware.GetUserID(c)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	// Get limit from query
	limit, _ := strconv.Atoi(c.Query("limit", "12"))
	if limit <= 0 || limit > 50 {
		limit = 12
	}

	// Get content-based recommendations
	attractions, reason, err := h.recommendationService.GetContentBased(c.Context(), userID, limit)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch recommendations",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"recommendations": attractions,
		"reason":          reason,
	})
}

// GetCollaborative - GET /api/v1/recommendations/collaborative
func (h *RecommendationHandler) GetCollaborative(c *fiber.Ctx) error {
	// Get user ID from context
	userID, ok := middleware.GetUserID(c)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	// Get limit from query
	limit, _ := strconv.Atoi(c.Query("limit", "12"))
	if limit <= 0 || limit > 50 {
		limit = 12
	}

	// Get collaborative filtering recommendations
	attractions, reason, err := h.recommendationService.GetCollaborativeFiltering(c.Context(), userID, limit)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch recommendations",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"recommendations": attractions,
		"reason":          reason,
	})
}
