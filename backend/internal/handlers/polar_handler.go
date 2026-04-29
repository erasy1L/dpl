package handlers

import (
	"backend/internal/middleware"
	"backend/internal/services/booking"
	"encoding/json"
	"errors"
	"net/http"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	polarco "github.com/polarsource/polar-go/models/components"
	standardwebhooks "github.com/standard-webhooks/standard-webhooks/libraries/go"
)

// PolarWebhookHandler verifies Standard Webhooks signatures and handles order.paid.
type PolarWebhookHandler struct {
	booking        booking.Service
	webhookSecret  string
}

func NewPolarWebhookHandler(bookingSvc booking.Service, webhookSecret string) *PolarWebhookHandler {
	return &PolarWebhookHandler{booking: bookingSvc, webhookSecret: webhookSecret}
}

// Polarsh handles POST /api/v1/webhooks/polar
func (h *PolarWebhookHandler) Handle(c *fiber.Ctx) error {
	if h.webhookSecret == "" {
		return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
			"error": "Polar webhook is not configured",
		})
	}
	body := c.Body()
	wh, err := standardwebhooks.NewWebhook(h.webhookSecret)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "webhook init failed"})
	}
	hdr := http.Header{}
	hdr.Set(standardwebhooks.HeaderWebhookID, c.Get(standardwebhooks.HeaderWebhookID))
	hdr.Set(standardwebhooks.HeaderWebhookSignature, c.Get(standardwebhooks.HeaderWebhookSignature))
	hdr.Set(standardwebhooks.HeaderWebhookTimestamp, c.Get(standardwebhooks.HeaderWebhookTimestamp))
	if err := wh.Verify(body, hdr); err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "invalid signature"})
	}

	var env struct {
		Type string          `json:"type"`
		Data json.RawMessage `json:"data"`
	}
	if err := json.Unmarshal(body, &env); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid json"})
	}
	if env.Type == "order.paid" {
		var ord polarco.Order
		if err := json.Unmarshal(env.Data, &ord); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid order payload"})
		}
		if err := h.booking.ProcessPolarOrderPaid(c.Context(), &ord); err != nil {
			// Acknowledge to avoid unbounded retries; fix data out-of-band
			_ = err
		}
	}
	return c.SendStatus(fiber.StatusOK)
}

// CreatePolarCheckout handles POST /api/v1/bookings/:id/polar/checkout
func (h *BookingHandler) CreatePolarCheckout(c *fiber.Ctx) error {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid booking ID"})
	}
	u, err := h.bookingService.CreatePolarCheckout(c.Context(), userID, id)
	if err != nil {
		switch {
		case errors.Is(err, booking.ErrPolarNotConfigured):
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{"error": "Polar is not configured"})
		case errors.Is(err, booking.ErrBookingNotFound):
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Booking not found"})
		case errors.Is(err, booking.ErrUnauthorizedBookingGet), errors.Is(err, booking.ErrPolarNotEligible):
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Booking is not eligible for Polar payment"})
		}
		// include details so misconfiguration / Polar API errors (token, product, currency) are visible in the client
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":   "Failed to start Polar checkout",
			"details": err.Error(),
		})
	}
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"checkout_url": u,
	})
}

// SyncPolarAfterReturn handles POST /api/v1/bookings/polar/sync
func (h *BookingHandler) SyncPolarAfterReturn(c *fiber.Ctx) error {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}
	var body struct {
		CheckoutID string `json:"checkout_id"`
	}
	if err := c.BodyParser(&body); err != nil || body.CheckoutID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "checkout_id is required"})
	}
	b, err := h.bookingService.SyncPolarAfterReturn(c.Context(), userID, body.CheckoutID)
	if err != nil {
		switch {
		case errors.Is(err, booking.ErrPolarNotConfigured):
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{"error": "Polar is not configured"})
		case errors.Is(err, booking.ErrBookingNotFound):
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Booking not found"})
		case errors.Is(err, booking.ErrUnauthorizedBookingGet):
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Forbidden"})
		case errors.Is(err, booking.ErrPolarAmountMismatch):
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Amount mismatch"})
		}
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Booking confirmed",
		"booking": b,
	})
}
