package handlers

import (
	"backend/internal/services/analytics"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

type AnalyticsHandler struct {
	analyticsService analytics.Service
}

func NewAnalyticsHandler(analyticsService analytics.Service) *AnalyticsHandler {
	return &AnalyticsHandler{
		analyticsService: analyticsService,
	}
}

// GetOverview - GET /api/v1/analytics/overview
func (h *AnalyticsHandler) GetOverview(c *fiber.Ctx) error {
	overview, err := h.analyticsService.GetOverview(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch analytics overview",
		})
	}

	return c.Status(fiber.StatusOK).JSON(overview)
}

// GetViewsOverTime - GET /api/v1/analytics/views-over-time
func (h *AnalyticsHandler) GetViewsOverTime(c *fiber.Ctx) error {
	days, _ := strconv.Atoi(c.Query("days", "30"))

	data, err := h.analyticsService.GetViewsOverTime(c.Context(), days)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch views over time",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"data": data,
	})
}

// GetCategories - GET /api/v1/analytics/categories
func (h *AnalyticsHandler) GetCategories(c *fiber.Ctx) error {
	data, err := h.analyticsService.GetCategoryDistribution(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch category distribution",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"data": data,
	})
}

// GetCities - GET /api/v1/analytics/cities
func (h *AnalyticsHandler) GetCities(c *fiber.Ctx) error {
	data, err := h.analyticsService.GetCityStatistics(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch city statistics",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"data": data,
	})
}

// GetTopAttractions - GET /api/v1/analytics/top-attractions
func (h *AnalyticsHandler) GetTopAttractions(c *fiber.Ctx) error {
	sortBy := c.Query("sort", "views")
	limit, _ := strconv.Atoi(c.Query("limit", "10"))

	attractions, err := h.analyticsService.GetTopAttractions(c.Context(), sortBy, limit)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch top attractions",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"attractions": attractions,
	})
}

// GetRatingDistribution - GET /api/v1/analytics/rating-distribution
func (h *AnalyticsHandler) GetRatingDistribution(c *fiber.Ctx) error {
	distribution, err := h.analyticsService.GetRatingDistribution(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch rating distribution",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"distribution": distribution,
	})
}
