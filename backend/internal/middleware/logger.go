package middleware

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

// LoggerConfig returns a configured logger middleware
func LoggerConfig() fiber.Handler {
	return logger.New(logger.Config{
		Format:     "[${time}] ${status} - ${method} ${path} - ${latency}\n",
		TimeFormat: "2006-01-02 15:04:05",
		TimeZone:   "Local",
	})
}

// RequestLogger is a custom logger middleware that logs request details
func RequestLogger() fiber.Handler {
	return func(c *fiber.Ctx) error {
		start := time.Now()

		// Process request
		err := c.Next()

		// Log request details
		duration := time.Since(start)

		// Get user ID if authenticated
		userID := "anonymous"
		if uid, ok := c.Locals("user_id").(string); ok {
			userID = uid
		}

		// You can add custom logging here if needed
		// For now, the standard logger middleware handles logging
		_ = userID
		_ = duration

		return err
	}
}
