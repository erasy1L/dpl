package handlers

import (
	"backend/internal/models"
	"backend/internal/services/tour"
	"errors"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

type TourHandler struct {
	tourService tour.Service
}

func NewTourHandler(tourService tour.Service) *TourHandler {
	return &TourHandler{
		tourService: tourService,
	}
}

// ListTours handles listing tours with filters and pagination
// GET /api/v1/tours
func (h *TourHandler) ListTours(c *fiber.Ctx) error {
	limitStr := c.Query("limit", "20")
	offsetStr := c.Query("offset", "0")

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	filter := &models.TourFilter{}

	if city := c.Query("city", ""); city != "" {
		filter.City = &city
	}
	if companyIDStr := c.Query("company_id", ""); companyIDStr != "" {
		if cid, err := strconv.Atoi(companyIDStr); err == nil {
			filter.CompanyID = &cid
		}
	}
	if minPriceStr := c.Query("min_price", ""); minPriceStr != "" {
		if v, err := strconv.ParseFloat(minPriceStr, 64); err == nil {
			filter.MinPrice = &v
		}
	}
	if maxPriceStr := c.Query("max_price", ""); maxPriceStr != "" {
		if v, err := strconv.ParseFloat(maxPriceStr, 64); err == nil {
			filter.MaxPrice = &v
		}
	}
	if durationStr := c.Query("duration", ""); durationStr != "" {
		if v, err := strconv.Atoi(durationStr); err == nil {
			filter.Duration = &v
		}
	}
	if diffStr := c.Query("difficulty", ""); diffStr != "" {
		d := models.TourDifficulty(diffStr)
		filter.Difficulty = &d
	}

	tours, total, err := h.tourService.List(c.Context(), filter, limit, offset)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch tours",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"tours":  tours,
		"total":  total,
		"limit":  limit,
		"offset": offset,
	})
}

// GetTour handles getting a single tour with company, attractions, and schedules
// GET /api/v1/tours/:id
func (h *TourHandler) GetTour(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid tour ID",
		})
	}

	t, err := h.tourService.GetByID(c.Context(), id)
	if err != nil {
		if errors.Is(err, tour.ErrTourNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Tour not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch tour",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"tour": t,
	})
}

// GetTourSchedules handles getting schedules for a tour
// GET /api/v1/tours/:id/schedules
func (h *TourHandler) GetTourSchedules(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid tour ID",
		})
	}

	schedules, err := h.tourService.GetSchedules(c.Context(), id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch schedules",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"schedules": schedules,
	})
}

// CreateTour handles creating a new tour
// POST /api/v1/tours
func (h *TourHandler) CreateTour(c *fiber.Ctx) error {
	var req models.CreateTourRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if req.CompanyID <= 0 || req.Name == nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "company_id and name are required",
		})
	}

	created, err := h.tourService.Create(c.Context(), &req)
	if err != nil {
		if errors.Is(err, tour.ErrCompanyDoesNotExist) {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Company not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create tour",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Tour created successfully",
		"tour":    created,
	})
}

// UpdateTour handles updating a tour
// PUT /api/v1/tours/:id
func (h *TourHandler) UpdateTour(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid tour ID",
		})
	}

	var req models.UpdateTourRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	updated, err := h.tourService.Update(c.Context(), id, &req)
	if err != nil {
		if errors.Is(err, tour.ErrTourNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Tour not found",
			})
		}
		if errors.Is(err, tour.ErrCompanyDoesNotExist) {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Company not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update tour",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Tour updated successfully",
		"tour":    updated,
	})
}

// DeleteTour handles deleting a tour
// DELETE /api/v1/tours/:id
func (h *TourHandler) DeleteTour(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid tour ID",
		})
	}

	if err := h.tourService.Delete(c.Context(), id); err != nil {
		if errors.Is(err, tour.ErrTourNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Tour not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete tour",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Tour deleted successfully",
	})
}

