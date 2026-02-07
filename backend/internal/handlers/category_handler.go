package handlers

import (
	"backend/internal/services/category"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

type CategoryHandler struct {
	categoryService category.CategoryService
}

func NewCategoryHandler(categoryService category.CategoryService) *CategoryHandler {
	return &CategoryHandler{
		categoryService: categoryService,
	}
}

type CategoryResponse struct {
	ID        int    `json:"id"`
	NameEn    string `json:"name_en"`
	NameRu    string `json:"name_ru"`
	Icon      string `json:"icon"`
	CreatedAt string `json:"created_at"`
}

// ListCategories handles listing all categories
// GET /api/v1/category
func (h *CategoryHandler) ListCategories(c *fiber.Ctx) error {
	// Get query parameters
	limitStr := c.Query("limit", "100")
	offsetStr := c.Query("offset", "0")
	search := c.Query("search", "")

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 0 {
		limit = 100
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	var dbCategories []interface{}
	var serviceErr error

	// Use search if query is provided
	if search != "" {
		cats, err := h.categoryService.Search(c.Context(), search, limit, offset)
		serviceErr = err
		for _, cat := range cats {
			dbCategories = append(dbCategories, cat)
		}
	} else {
		cats, err := h.categoryService.List(c.Context(), limit, offset)
		serviceErr = err
		for _, cat := range cats {
			dbCategories = append(dbCategories, cat)
		}
	}

	if serviceErr != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch categories",
		})
	}

	// Convert to response format
	var categories []CategoryResponse
	for _, item := range dbCategories {
		if cat, ok := item.(interface {
			GetID() int
			GetNameEn() string
			GetNameRu() string
			GetIcon() string
			GetCreatedAt() string
		}); ok {
			categories = append(categories, CategoryResponse{
				ID:        cat.GetID(),
				NameEn:    cat.GetNameEn(),
				NameRu:    cat.GetNameRu(),
				Icon:      cat.GetIcon(),
				CreatedAt: cat.GetCreatedAt(),
			})
		}
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"categories": dbCategories,
		"count":      len(categories),
	})
}
