package middleware

import (
	"os"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// OptionalAuthMiddleware parses Bearer JWT when present; continues without error if missing or invalid.
func OptionalAuthMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Next()
		}
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			return c.Next()
		}
		tokenString := parts[1]
		token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fiber.NewError(fiber.StatusUnauthorized, "Invalid signing method")
			}
			return []byte(os.Getenv("JWT_SECRET")), nil
		})
		if err != nil {
			return c.Next()
		}
		if claims, ok := token.Claims.(*JWTClaims); ok && token.Valid {
			c.Locals("user_id", claims.UserID)
			c.Locals("user_email", claims.Email)
			c.Locals("user_role", claims.Role)
		}
		return c.Next()
	}
}

// TryGetUserID returns user ID if OptionalAuth or Auth set it.
func TryGetUserID(c *fiber.Ctx) (uuid.UUID, bool) {
	return GetUserID(c)
}
