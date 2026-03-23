package handlers

import (
	"backend/internal/models"
	"backend/internal/repository"
	"backend/internal/services/category"
	"backend/internal/services/attraction"
	"errors"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
)

type AttractionHandler struct {
	attractionService attraction.AttractionService
	categoryService   category.CategoryService
}

func NewAttractionHandler(attractionService attraction.AttractionService, categoryService category.CategoryService) *AttractionHandler {
	return &AttractionHandler{
		attractionService: attractionService,
		categoryService:   categoryService,
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

// GetCities handles getting cities with attraction counts
// GET /api/v1/attractions/cities
func (h *AttractionHandler) GetCities(c *fiber.Ctx) error {
	limitStr := c.Query("limit", "10")
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 0 {
		limit = 10
	}

	cities, err := h.attractionService.GetCitiesWithCount(c.Context(), limit)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch cities",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"cities": cities,
		"count":  len(cities),
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

// CreateAttraction handles creating a new attraction.
// POST /api/v1/attractions
func (h *AttractionHandler) CreateAttraction(c *fiber.Ctx) error {
	var req models.CreateAttractionRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if req.Name == nil || req.City == nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Name and city are required",
		})
	}

	attr := &models.Attraction{
		Name:        req.Name,
		Description: req.Description,
		City:        req.City,
		Address:     req.Address,
		Country:     req.Country,
		Latitude:    req.Latitude,
		Longitude:   req.Longitude,
		Images:      models.ImageArray(req.Images),
	}

	if len(req.CategoryIDs) > 0 {
		attr.Categories = make([]models.Category, 0, len(req.CategoryIDs))
		for _, cid := range req.CategoryIDs {
			if cid <= 0 {
				continue
			}

			cat, err := h.categoryService.GetByID(c.Context(), cid)
			if err != nil {
				if errors.Is(err, category.ErrCategoryNotFound) {
					return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
						"error": "Invalid category_id: category not found",
					})
				}
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
					"error": "Failed to fetch categories",
				})
			}

			attr.Categories = append(attr.Categories, *cat)
		}
	}

	if err := h.attractionService.Create(c.Context(), attr); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create attraction",
		})
	}

	created, err := h.attractionService.GetByID(c.Context(), attr.ID)
	if err != nil {
		// Attraction was created but retrieval failed; still return created ID.
		return c.Status(fiber.StatusCreated).JSON(fiber.Map{
			"message": "Attraction created successfully",
			"id":       attr.ID,
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Attraction created successfully",
		"attraction": AttractionResponse{
			ID:                created.ID,
			Name:              LocalizedField(created.Name),
			Description:       LocalizedField(created.Description),
			City:              LocalizedField(created.City),
			Address:           LocalizedField(created.Address),
			Country:           LocalizedField(created.Country),
			Latitude:          created.Latitude,
			Longitude:         created.Longitude,
			Images:            created.Images,
			AverageRating:     created.AverageRating,
			TotalRatings:      created.TotalRatings,
			TotalViews:        created.TotalViews,
			ReviewRatingCount: map[string]int(created.ReviewRatingCount),
			Categories:        created.Categories,
			CreatedAt:         created.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		},
	})
}

// UpdateAttraction handles updating an existing attraction.
// PUT /api/v1/attractions/:id
func (h *AttractionHandler) UpdateAttraction(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid attraction ID",
		})
	}

	var req models.UpdateAttractionRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	attr, err := h.attractionService.GetByID(c.Context(), id)
	if err != nil {
		if errors.Is(err, attraction.ErrAttractionNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Attraction not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch attraction",
		})
	}

	// Only overwrite fields that were present in request (maps can be nil when absent).
	if req.Name != nil {
		attr.Name = req.Name
	}
	if req.Description != nil {
		attr.Description = req.Description
	}
	if req.City != nil {
		attr.City = req.City
	}
	if req.Address != nil {
		attr.Address = req.Address
	}
	if req.Country != nil {
		attr.Country = req.Country
	}
	if req.Latitude != nil {
		attr.Latitude = req.Latitude
	}
	if req.Longitude != nil {
		attr.Longitude = req.Longitude
	}
	if req.Images != nil {
		attr.Images = models.ImageArray(req.Images)
	}
	if req.CategoryIDs != nil {
		attr.Categories = make([]models.Category, 0, len(req.CategoryIDs))
		for _, cid := range req.CategoryIDs {
			if cid <= 0 {
				continue
			}

			cat, err := h.categoryService.GetByID(c.Context(), cid)
			if err != nil {
				if errors.Is(err, category.ErrCategoryNotFound) {
					return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
						"error": "Invalid category_id: category not found",
					})
				}
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
					"error": "Failed to fetch categories",
				})
			}

			attr.Categories = append(attr.Categories, *cat)
		}
	}

	if err := h.attractionService.Update(c.Context(), attr); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update attraction",
		})
	}

	updated, err := h.attractionService.GetByID(c.Context(), id)
	if err != nil {
		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"message": "Attraction updated successfully",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Attraction updated successfully",
		"attraction": AttractionResponse{
			ID:                updated.ID,
			Name:              LocalizedField(updated.Name),
			Description:       LocalizedField(updated.Description),
			City:              LocalizedField(updated.City),
			Address:           LocalizedField(updated.Address),
			Country:           LocalizedField(updated.Country),
			Latitude:          updated.Latitude,
			Longitude:         updated.Longitude,
			Images:            updated.Images,
			AverageRating:     updated.AverageRating,
			TotalRatings:      updated.TotalRatings,
			TotalViews:        updated.TotalViews,
			ReviewRatingCount: map[string]int(updated.ReviewRatingCount),
			Categories:        updated.Categories,
			CreatedAt:         updated.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		},
	})
}

// DeleteAttraction handles deleting an existing attraction.
// DELETE /api/v1/attractions/:id
func (h *AttractionHandler) DeleteAttraction(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid attraction ID",
		})
	}

	// Ensure attraction exists to return correct status code.
	if _, err := h.attractionService.GetByID(c.Context(), id); err != nil {
		if errors.Is(err, attraction.ErrAttractionNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Attraction not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch attraction",
		})
	}

	if err := h.attractionService.Delete(c.Context(), id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete attraction",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Attraction deleted successfully",
	})
}
