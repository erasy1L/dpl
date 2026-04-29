package handlers

import (
	"backend/internal/models"
	"backend/internal/services/company"
	"errors"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

type TourCompanyHandler struct {
	companyService company.Service
}

func NewTourCompanyHandler(companyService company.Service) *TourCompanyHandler {
	return &TourCompanyHandler{
		companyService: companyService,
	}
}

// ListCompanies handles listing tour companies with pagination and optional city filter
// GET /api/v1/companies
func (h *TourCompanyHandler) ListCompanies(c *fiber.Ctx) error {
	limitStr := c.Query("limit", "20")
	offsetStr := c.Query("offset", "0")
	city := c.Query("city", "")

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

	var cityPtr *string
	if city != "" {
		cityPtr = &city
	}

	companies, total, err := h.companyService.List(c.Context(), cityPtr, limit, offset)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch companies",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"companies": companies,
		"total":     total,
		"limit":     limit,
		"offset":    offset,
	})
}

// GetCompany handles getting a single company by ID with its tours
// GET /api/v1/companies/:id
func (h *TourCompanyHandler) GetCompany(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid company ID",
		})
	}

	companyObj, err := h.companyService.GetByID(c.Context(), id)
	if err != nil {
		if errors.Is(err, company.ErrCompanyNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Company not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch company",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"company": companyObj,
	})
}

// CreateCompany handles creating a new tour company
// POST /api/v1/companies
func (h *TourCompanyHandler) CreateCompany(c *fiber.Ctx) error {
	var req models.CreateTourCompanyRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if req.Name == nil || req.City == nil || req.Logo == "" || req.Phone == "" || req.Email == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "name, city, logo, phone and email are required",
		})
	}

	created, err := h.companyService.Create(c.Context(), &req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create company",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Company created successfully",
		"company": created,
	})
}

// UpdateCompany handles updating an existing tour company
// PUT /api/v1/companies/:id
func (h *TourCompanyHandler) UpdateCompany(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid company ID",
		})
	}

	var req models.UpdateTourCompanyRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	updated, err := h.companyService.Update(c.Context(), id, &req)
	if err != nil {
		if errors.Is(err, company.ErrCompanyNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Company not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update company",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Company updated successfully",
		"company": updated,
	})
}

// DeleteCompany handles deleting a tour company
// DELETE /api/v1/companies/:id
func (h *TourCompanyHandler) DeleteCompany(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid company ID",
		})
	}

	if err := h.companyService.Delete(c.Context(), id); err != nil {
		if errors.Is(err, company.ErrCompanyNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Company not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete company",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Company deleted successfully",
	})
}

