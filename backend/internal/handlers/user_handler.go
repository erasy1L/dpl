package handlers

import (
	"backend/internal/middleware"
	"backend/internal/models"
	"backend/internal/services/user"
	"errors"
	"github.com/google/uuid"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
)

type UserHandler struct {
	userService user.UserService
}

func NewUserHandler(userService user.UserService) *UserHandler {
	return &UserHandler{
		userService: userService,
	}
}

// GetMyProfile - GET /api/v1/users/me
func (h *UserHandler) GetMyProfile(c *fiber.Ctx) error {
	// Get user ID from context
	userID, ok := middleware.GetUserID(c)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	// Get user profile with stats
	profile, err := h.userService.GetUserProfile(c.Context(), userID)
	if err != nil {
		if errors.Is(err, user.ErrUserNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "User not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch user profile",
		})
	}

	return c.Status(fiber.StatusOK).JSON(profile)
}

type UpdateUserRoleRequest struct {
	Role string `json:"role"`
}

// UpdateUserRole handles changing user role (admin only).
// PUT /api/v1/admin/users/:id/role
func (h *UserHandler) UpdateUserRole(c *fiber.Ctx) error {
	idStr := c.Params("id")
	userID, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid user ID",
		})
	}

	var req UpdateUserRoleRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	role := strings.ToLower(strings.TrimSpace(req.Role))
	switch role {
	case string(models.RoleUser), string(models.RoleManager), string(models.RoleAdmin):
		// ok
	default:
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid role. Use: user, manager, admin",
		})
	}

	targetUser, err := h.userService.GetByID(c.Context(), userID)
	if err != nil {
		if errors.Is(err, user.ErrUserNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "User not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch user",
		})
	}

	targetUser.Role = models.UserRole(role)
	if err := h.userService.Update(c.Context(), targetUser); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update user role",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Role updated successfully",
		"user":    targetUser.ToResponse(),
	})
}

// ListUsers handles listing users for admin panel.
// GET /api/v1/admin/users
func (h *UserHandler) ListUsers(c *fiber.Ctx) error {
	limitStr := c.Query("limit", "100")
	offsetStr := c.Query("offset", "0")

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 100
	}
	if limit > 500 {
		limit = 500
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	users, err := h.userService.List(c.Context(), limit, offset)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch users",
		})
	}

	total, err := h.userService.Count(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to count users",
		})
	}

	responses := make([]models.UserResponse, 0, len(users))
	for i := range users {
		responses = append(responses, users[i].ToResponse())
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"users":  responses,
		"count":  len(responses),
		"total":  total,
		"limit":  limit,
		"offset": offset,
	})
}
