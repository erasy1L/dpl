package handlers

import (
	"backend/internal/middleware"
	"backend/internal/services/user"
	"errors"

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
