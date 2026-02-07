package handlers

import (
	"backend/internal/services/auth"
	"backend/pkg/utils"

	"github.com/gofiber/fiber/v2"
)

type AuthHandler struct {
	authService auth.AuthService
}

func NewAuthHandler(authService auth.AuthService) *AuthHandler {
	return &AuthHandler{
		authService: authService,
	}
}

type SignInRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=6"`
}

type SignUpRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=6"`
	Name     string `json:"name" validate:"required,min=2"`
}

type AuthResponse struct {
	ID    string `json:"id"`
	Email string `json:"email"`
	Name  string `json:"name"`
}

// SignIn handles user sign-in
// POST /api/v1/auth/sign-in
func (h *AuthHandler) SignIn(c *fiber.Ctx) error {
	var req SignInRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	user, err := h.authService.SignIn(c.Context(), req.Email, req.Password)
	if err != nil {
		if err == auth.ErrInvalidCredentials {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid email or password",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Internal server error",
		})
	}

	// Generate JWT token
	token, err := utils.GenerateJWT(user.ID, user.Email)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to generate token",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Sign in successful",
		"token":   token,
	})
}

// SignOut handles user sign-out
// POST /api/v1/auth/sign-out
func (h *AuthHandler) SignOut(c *fiber.Ctx) error {
	// In a real application, you would invalidate the session or JWT token here
	// For now, we'll just return a success message
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Sign out successful",
	})
}

// SignUp handles user registration
// POST /api/v1/auth/sign-up
func (h *AuthHandler) SignUp(c *fiber.Ctx) error {
	var req SignUpRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	user, err := h.authService.SignUp(c.Context(), req.Email, req.Password, req.Name)
	if err != nil {
		if err == auth.ErrEmailAlreadyExists {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "Email already exists",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Internal server error",
		})
	}

	// Generate JWT token
	token, err := utils.GenerateJWT(user.ID, user.Email)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to generate token",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Sign up successful",
		"token":   token,
		"user": AuthResponse{
			ID:    user.ID.String(),
			Email: user.Email,
			Name:  user.Name,
		},
	})
}
