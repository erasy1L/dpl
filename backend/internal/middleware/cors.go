package middleware

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

// CORSConfig returns a configured CORS middleware
func CORSConfig() fiber.Handler {
	return cors.New(cors.Config{
		AllowOrigins:     "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000,http://localhost:8080",
		AllowMethods:     "GET,POST,PUT,DELETE,PATCH,OPTIONS",
		AllowHeaders:     "Origin,Content-Type,Accept,Authorization,X-Requested-With,webhook-id,webhook-timestamp,webhook-signature",
		AllowCredentials: true,
		ExposeHeaders:    "Content-Length,Content-Type",
		MaxAge:           86400, // 24 hours
	})
}
