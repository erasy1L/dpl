package handlers

import (
	"backend/internal/middleware"
	"backend/internal/models"
	"backend/internal/services/rating"
	"errors"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

type RatingHandler struct {
	ratingService rating.Service
}

func NewRatingHandler(ratingService rating.Service) *RatingHandler {
	return &RatingHandler{
		ratingService: ratingService,
	}
}

// CreateOrUpdateRating - POST /api/v1/ratings
func (h *RatingHandler) CreateOrUpdateRating(c *fiber.Ctx) error {
	// Get user ID from context
	userID, ok := middleware.GetUserID(c)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}
	// Parse request body
	var req models.CreateRatingRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Validate request
	if req.AttractionID <= 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid attraction ID",
		})
	}

	if req.Rating < 1 || req.Rating > 5 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Rating must be between 1 and 5",
		})
	}

	// Create or update rating
	ratingObj, err := h.ratingService.CreateOrUpdate(c.Context(), userID, &req)
	if err != nil {
		if errors.Is(err, rating.ErrAttractionNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Attraction not found",
			})
		}
		if errors.Is(err, rating.ErrInvalidRatingValue) {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": err.Error(),
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create rating",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Rating created successfully",
		"rating":  ratingObj,
	})
}

// GetAttractionRatings - GET /api/v1/attractions/:id/ratings
func (h *RatingHandler) GetAttractionRatings(c *fiber.Ctx) error {
	// Get attraction ID from URL
	attractionID, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid attraction ID",
		})
	}

	// Get pagination parameters
	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	offset, _ := strconv.Atoi(c.Query("offset", "0"))

	// Get ratings
	ratings, total, err := h.ratingService.GetAttractionRatings(c.Context(), attractionID, limit, offset)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch ratings",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"ratings": ratings,
		"total":   total,
		"limit":   limit,
		"offset":  offset,
	})
}

// GetMyRatings - GET /api/v1/ratings/my
func (h *RatingHandler) GetMyRatings(c *fiber.Ctx) error {
	// Get user ID from context
	userID, ok := middleware.GetUserID(c)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	// Get user's ratings
	ratings, err := h.ratingService.GetUserRatings(c.Context(), userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch ratings",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"ratings": ratings,
	})
}

// UpdateRating - PUT /api/v1/ratings/:id
func (h *RatingHandler) UpdateRating(c *fiber.Ctx) error {
	// Get user ID from context
	userID, ok := middleware.GetUserID(c)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	// Get rating ID from URL
	ratingID, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid rating ID",
		})
	}

	// Parse request body
	var req models.UpdateRatingRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Validate rating value
	if req.Rating < 1 || req.Rating > 5 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Rating must be between 1 and 5",
		})
	}

	// Update rating
	err = h.ratingService.UpdateRating(c.Context(), ratingID, userID, &req)
	if err != nil {
		if errors.Is(err, rating.ErrRatingNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Rating not found",
			})
		}
		if errors.Is(err, rating.ErrUnauthorized) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "You can only update your own ratings",
			})
		}
		if errors.Is(err, rating.ErrInvalidRatingValue) {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": err.Error(),
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update rating",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Rating updated successfully",
	})
}

// DeleteRating - DELETE /api/v1/ratings/:id
func (h *RatingHandler) DeleteRating(c *fiber.Ctx) error {
	// Get user ID from context
	userID, ok := middleware.GetUserID(c)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	// Get rating ID from URL
	ratingID, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid rating ID",
		})
	}

	// Delete rating
	err = h.ratingService.DeleteRating(c.Context(), ratingID, userID)
	if err != nil {
		if errors.Is(err, rating.ErrRatingNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Rating not found",
			})
		}
		if errors.Is(err, rating.ErrUnauthorized) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "You can only delete your own ratings",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete rating",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Rating deleted successfully",
	})
}
