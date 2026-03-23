package handlers

import (
	"backend/internal/models"
	"backend/internal/services/category"
	"errors"
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
	ID              int    `json:"id"`
	NameEn          string `json:"name_en"`
	NameRu          string `json:"name_ru"`
	Icon            string `json:"icon"`
	AttractionCount int    `json:"attraction_count"`
	CreatedAt       string `json:"created_at"`
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

	// Use search with count if query is provided
	var categories []CategoryResponse
	var total int
	var serviceErr error

	if search != "" {
		cats, err := h.categoryService.SearchWithCount(c.Context(), search, limit, offset)
		serviceErr = err
		for _, cat := range cats {
			categories = append(categories, CategoryResponse{
				ID:              cat.ID,
				NameEn:          cat.NameEn,
				NameRu:          cat.NameRu,
				Icon:            cat.Icon,
				AttractionCount: cat.AttractionCount,
				CreatedAt:       cat.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			})
		}

		// total should represent full result set size, not current page size
		allCats, err := h.categoryService.SearchWithCount(c.Context(), search, 0, 0)
		if err != nil {
			serviceErr = err
		} else {
			total = len(allCats)
		}
	} else {
		cats, err := h.categoryService.ListWithCount(c.Context(), limit, offset)
		serviceErr = err
		for _, cat := range cats {
			categories = append(categories, CategoryResponse{
				ID:              cat.ID,
				NameEn:          cat.NameEn,
				NameRu:          cat.NameRu,
				Icon:            cat.Icon,
				AttractionCount: cat.AttractionCount,
				CreatedAt:       cat.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			})
		}

		// total should represent full result set size, not current page size
		allCats, err := h.categoryService.ListWithCount(c.Context(), 0, 0)
		if err != nil {
			serviceErr = err
		} else {
			total = len(allCats)
		}
	}

	if serviceErr != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch categories",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"categories": categories,
		"count":      total,
	})
}

// CreateCategory handles creating a new category.
// POST /api/v1/category
func (h *CategoryHandler) CreateCategory(c *fiber.Ctx) error {
	var req models.CreateCategoryRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if req.NameEn == "" || req.Icon == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "name_en and icon are required",
		})
	}

	categoryObj := &models.Category{
		NameEn: req.NameEn,
		NameRu: req.NameRu,
		Icon:   req.Icon,
	}

	if err := h.categoryService.Create(c.Context(), categoryObj); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create category",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Category created successfully",
		"category": CategoryResponse{
			ID:              categoryObj.ID,
			NameEn:          categoryObj.NameEn,
			NameRu:          categoryObj.NameRu,
			Icon:            categoryObj.Icon,
			AttractionCount: 0,
			CreatedAt:       categoryObj.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		},
	})
}

// UpdateCategory handles updating an existing category.
// PUT /api/v1/category/:id
func (h *CategoryHandler) UpdateCategory(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid category ID",
		})
	}

	var req models.UpdateCategoryRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	categoryObj, err := h.categoryService.GetByID(c.Context(), id)
	if err != nil {
		if errors.Is(err, category.ErrCategoryNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Category not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch category",
		})
	}

	if req.NameEn != "" {
		categoryObj.NameEn = req.NameEn
	}
	if req.NameRu != "" {
		categoryObj.NameRu = req.NameRu
	}
	if req.Icon != "" {
		categoryObj.Icon = req.Icon
	}

	if err := h.categoryService.Update(c.Context(), categoryObj); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update category",
		})
	}

	updated, err := h.categoryService.GetByID(c.Context(), id)
	if err != nil {
		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"message": "Category updated successfully",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Category updated successfully",
		"category": CategoryResponse{
			ID:              updated.ID,
			NameEn:          updated.NameEn,
			NameRu:          updated.NameRu,
			Icon:            updated.Icon,
			AttractionCount: 0,
			CreatedAt:       updated.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		},
	})
}

// DeleteCategory handles deleting an existing category.
// DELETE /api/v1/category/:id
func (h *CategoryHandler) DeleteCategory(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid category ID",
		})
	}

	if _, err := h.categoryService.GetByID(c.Context(), id); err != nil {
		if errors.Is(err, category.ErrCategoryNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Category not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch category",
		})
	}

	if err := h.categoryService.Delete(c.Context(), id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete category",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Category deleted successfully",
	})
}
