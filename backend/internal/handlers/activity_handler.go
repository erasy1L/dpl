package handlers

import (
	"backend/internal/middleware"
	"backend/internal/models"
	"backend/internal/services/activity"
	"errors"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type ActivityHandler struct {
	activityService activity.Service
}

func NewActivityHandler(activityService activity.Service) *ActivityHandler {
	return &ActivityHandler{
		activityService: activityService,
	}
}

// TrackView - POST /api/v1/attractions/:id/view
func (h *ActivityHandler) TrackView(c *fiber.Ctx) error {
	// Get attraction ID from URL
	attractionID, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid attraction ID",
		})
	}

	// Get user ID from context (optional - can be anonymous)
	userID, _ := middleware.GetUserID(c)
	var userIDPtr *uuid.UUID
	if userID != uuid.Nil {
		userIDPtr = &userID
	}

	// Track view
	if err := h.activityService.TrackView(c.Context(), userIDPtr, attractionID); err != nil {
		if errors.Is(err, activity.ErrAttractionNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Attraction not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to track view",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "View tracked successfully",
	})
}

// AddFavorite - POST /api/v1/users/me/favorites
func (h *ActivityHandler) AddFavorite(c *fiber.Ctx) error {
	// Get user ID from context
	userID, ok := middleware.GetUserID(c)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	// Parse request body
	var req models.AddFavoriteRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Add to favorites
	if err := h.activityService.AddFavorite(c.Context(), userID, req.AttractionID); err != nil {
		if errors.Is(err, activity.ErrAttractionNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Attraction not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to add favorite",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Added to favorites",
	})
}

// RemoveFavorite - DELETE /api/v1/users/me/favorites/:attraction_id
func (h *ActivityHandler) RemoveFavorite(c *fiber.Ctx) error {
	// Get user ID from context
	userID, ok := middleware.GetUserID(c)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	// Get attraction ID from URL
	attractionID, err := strconv.Atoi(c.Params("attraction_id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid attraction ID",
		})
	}

	// Remove from favorites
	if err := h.activityService.RemoveFavorite(c.Context(), userID, attractionID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to remove favorite",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Removed from favorites",
	})
}

// GetMyFavorites - GET /api/v1/users/me/favorites
func (h *ActivityHandler) GetMyFavorites(c *fiber.Ctx) error {
	// Get user ID from context
	userID, ok := middleware.GetUserID(c)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	// Get favorites
	favorites, err := h.activityService.GetUserFavorites(c.Context(), userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch favorites",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"favorites": favorites,
		"count":     len(favorites),
	})
}

// IsFavorite - GET /api/v1/favorites/:attraction_id/check
func (h *ActivityHandler) IsFavorite(c *fiber.Ctx) error {
	// Get user ID from context
	userID, ok := middleware.GetUserID(c)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	// Get attraction ID from URL
	attractionID, err := strconv.Atoi(c.Params("attraction_id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid attraction ID",
		})
	}

	// Check if favorited
	isFav, err := h.activityService.IsFavorite(c.Context(), userID, attractionID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to check favorite status",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"is_favorite": isFav,
	})
}

// TrackShare - POST /api/v1/attractions/:id/share
func (h *ActivityHandler) TrackShare(c *fiber.Ctx) error {
	// Get attraction ID from URL
	attractionID, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid attraction ID",
		})
	}

	// Get user ID from context (optional)
	userID, _ := middleware.GetUserID(c)
	var userIDPtr *uuid.UUID
	if userID != uuid.Nil {
		userIDPtr = &userID
	}

	// Parse request body (optional)
	var req models.TrackShareRequest
	_ = c.BodyParser(&req)

	// Track share
	if err := h.activityService.TrackShare(c.Context(), userIDPtr, attractionID, req.Platform); err != nil {
		if errors.Is(err, activity.ErrAttractionNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Attraction not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to track share",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Share tracked successfully",
	})
}

// GetMyActivity - GET /api/v1/users/me/activity
func (h *ActivityHandler) GetMyActivity(c *fiber.Ctx) error {
	// Get user ID from context
	userID, ok := middleware.GetUserID(c)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	// Get query parameters
	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	offset, _ := strconv.Atoi(c.Query("offset", "0"))
	activityTypeStr := c.Query("type")

	var activityType *models.ActivityType
	if activityTypeStr != "" {
		at := models.ActivityType(activityTypeStr)
		activityType = &at
	}

	// Get activities
	activities, total, err := h.activityService.GetUserActivity(c.Context(), userID, activityType, limit, offset)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch activities",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"activities": activities,
		"total":      total,
		"limit":      limit,
		"offset":     offset,
	})
}

// GetPopular - GET /api/v1/attractions/popular
func (h *ActivityHandler) GetPopular(c *fiber.Ctx) error {
	// Get query parameters
	city := c.Query("city")
	limit, _ := strconv.Atoi(c.Query("limit", "10"))

	var cityPtr *string
	if city != "" {
		cityPtr = &city
	}

	// Get popular attractions
	attractions, err := h.activityService.GetPopular(c.Context(), cityPtr, limit)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch popular attractions",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"attractions": attractions,
	})
}

// GetTrending - GET /api/v1/attractions/trending
func (h *ActivityHandler) GetTrending(c *fiber.Ctx) error {
	// Get query parameters
	city := c.Query("city")
	limit, _ := strconv.Atoi(c.Query("limit", "10"))

	var cityPtr *string
	if city != "" {
		cityPtr = &city
	}

	// Get trending attractions
	attractions, err := h.activityService.GetTrending(c.Context(), cityPtr, limit)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch trending attractions",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"attractions": attractions,
	})
}

// GetPreferences - GET /api/v1/users/me/preferences
func (h *ActivityHandler) GetPreferences(c *fiber.Ctx) error {
	// Get user ID from context
	userID, ok := middleware.GetUserID(c)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	// Get preferences
	prefs, err := h.activityService.GetPreferences(c.Context(), userID)
	if err != nil {
		if errors.Is(err, activity.ErrPreferencesNotFound) {
			return c.Status(fiber.StatusOK).JSON(fiber.Map{
				"preferred_categories": []int{},
				"preferred_cities":     []string{},
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch preferences",
		})
	}

	return c.Status(fiber.StatusOK).JSON(prefs)
}

// UpdatePreferences - PUT /api/v1/users/me/preferences
func (h *ActivityHandler) UpdatePreferences(c *fiber.Ctx) error {
	// Get user ID from context
	userID, ok := middleware.GetUserID(c)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	// Parse request body
	var req models.UpdatePreferencesRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Update preferences
	if err := h.activityService.UpdatePreferences(c.Context(), userID, &req); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update preferences",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Preferences updated successfully",
	})
}
