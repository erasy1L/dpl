package middleware

import (
	"github.com/gofiber/fiber/v2"
)

// RequireRoles restricts access by user role stored in JWT middleware context.
// If role is missing -> 401, if role is not allowed -> 403.
func RequireRoles(allowedRoles ...string) fiber.Handler {
	allowed := make(map[string]struct{}, len(allowedRoles))
	for _, r := range allowedRoles {
		allowed[r] = struct{}{}
	}

	return func(c *fiber.Ctx) error {
		role, ok := GetUserRole(c)
		if !ok || role == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Unauthorized",
			})
		}

		if _, ok := allowed[role]; !ok {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "Forbidden",
			})
		}

		return c.Next()
	}
}

