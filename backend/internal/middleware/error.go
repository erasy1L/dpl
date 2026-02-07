package middleware

import (
	"github.com/gofiber/fiber/v2"
)

// ErrorResponse represents a standard error response
type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message,omitempty"`
	Code    int    `json:"code"`
}

// ErrorHandler is a centralized error handling middleware
func ErrorHandler() fiber.Handler {
	return func(c *fiber.Ctx) error {
		err := c.Next()

		if err != nil {
			// Default error response
			code := fiber.StatusInternalServerError
			message := "Internal Server Error"

			// Check if it's a Fiber error
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
				message = e.Message
			}

			// Return error response
			return c.Status(code).JSON(ErrorResponse{
				Error: message,
				Code:  code,
			})
		}

		return nil
	}
}

// NotFoundHandler handles 404 errors
func NotFoundHandler(c *fiber.Ctx) error {
	return c.Status(fiber.StatusNotFound).JSON(ErrorResponse{
		Error:   "Route not found",
		Message: "The requested resource does not exist",
		Code:    fiber.StatusNotFound,
	})
}

// MethodNotAllowedHandler handles 405 errors
func MethodNotAllowedHandler(c *fiber.Ctx) error {
	return c.Status(fiber.StatusMethodNotAllowed).JSON(ErrorResponse{
		Error:   "Method not allowed",
		Message: "The HTTP method is not allowed for this route",
		Code:    fiber.StatusMethodNotAllowed,
	})
}
