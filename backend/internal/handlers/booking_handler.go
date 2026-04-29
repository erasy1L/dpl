package handlers

import (
	"backend/internal/middleware"
	"backend/internal/models"
	"backend/internal/services/booking"
	"errors"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type BookingHandler struct {
	bookingService booking.Service
}

func NewBookingHandler(bookingService booking.Service) *BookingHandler {
	return &BookingHandler{
		bookingService: bookingService,
	}
}

// CreateBooking handles creating a new booking
// POST /api/v1/bookings
func (h *BookingHandler) CreateBooking(c *fiber.Ctx) error {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	var req models.CreateBookingRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if req.TourID <= 0 || req.ScheduleID <= 0 || req.NumberOfPeople <= 0 || req.ContactEmail == "" || req.ContactPhone == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "tour_id, schedule_id, number_of_people, contact_email and contact_phone are required",
		})
	}

	created, err := h.bookingService.Create(c.Context(), userID, &req)
	if err != nil {
		switch {
		case errors.Is(err, booking.ErrTourNotFound):
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Tour not found",
			})
		case errors.Is(err, booking.ErrScheduleNotFound):
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Schedule not found",
			})
		case errors.Is(err, booking.ErrInsufficientSpots):
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Not enough available spots",
			})
		case errors.Is(err, booking.ErrInvalidBookingStatus):
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Schedule is not available for booking",
			})
		}

		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create booking",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Booking created successfully",
		"booking": created,
	})
}

// GetMyBookings handles fetching bookings for current user
// GET /api/v1/bookings/my
func (h *BookingHandler) GetMyBookings(c *fiber.Ctx) error {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	offset, _ := strconv.Atoi(c.Query("offset", "0"))

	bookings, total, err := h.bookingService.GetMyBookings(c.Context(), userID, limit, offset)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch bookings",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"bookings": bookings,
		"total":    total,
		"limit":    limit,
		"offset":   offset,
	})
}

// GetBooking handles getting booking detail
// GET /api/v1/bookings/:id
func (h *BookingHandler) GetBooking(c *fiber.Ctx) error {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid booking ID",
		})
	}

	role, _ := middleware.GetUserRole(c)
	isManagerOrAdmin := role == string(models.RoleManager) || role == string(models.RoleAdmin)

	bookingObj, err := h.bookingService.GetByIDForUser(c.Context(), id, userID, isManagerOrAdmin)
	if err != nil {
		if errors.Is(err, booking.ErrBookingNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Booking not found",
			})
		}
		if errors.Is(err, booking.ErrUnauthorizedBookingGet) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "You are not allowed to view this booking",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch booking",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"booking": bookingObj,
	})
}

// CancelBooking handles cancelling a booking
// PUT /api/v1/bookings/:id/cancel
func (h *BookingHandler) CancelBooking(c *fiber.Ctx) error {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}

	idStr := c.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid booking ID",
		})
	}

	role, _ := middleware.GetUserRole(c)
	isManagerOrAdmin := role == string(models.RoleManager) || role == string(models.RoleAdmin)

	bookingObj, err := h.bookingService.Cancel(c.Context(), id, userID, isManagerOrAdmin)
	if err != nil {
		switch {
		case errors.Is(err, booking.ErrBookingNotFound):
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Booking not found",
			})
		case errors.Is(err, booking.ErrUnauthorizedBookingGet):
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "You are not allowed to cancel this booking",
			})
		case errors.Is(err, booking.ErrInvalidBookingStatus):
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Booking cannot be cancelled in current status",
			})
		case errors.Is(err, booking.ErrPaidBookingNonCancellable):
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Paid bookings cannot be cancelled here; contact support for a refund",
			})
		case errors.Is(err, booking.ErrScheduleNotFound):
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Schedule not found",
			})
		}

		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to cancel booking",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Booking cancelled successfully",
		"booking": bookingObj,
	})
}

// GetCompanyBookings handles listing bookings for a company (manager/admin)
// GET /api/v1/bookings/company/:company_id
func (h *BookingHandler) GetCompanyBookings(c *fiber.Ctx) error {
	role, _ := middleware.GetUserRole(c)
	if role != string(models.RoleManager) && role != string(models.RoleAdmin) {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Forbidden",
		})
	}

	companyIDStr := c.Params("company_id")
	companyID, err := strconv.Atoi(companyIDStr)
	if err != nil || companyID <= 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid company ID",
		})
	}

	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	offset, _ := strconv.Atoi(c.Query("offset", "0"))

	bookings, total, err := h.bookingService.GetCompanyBookings(c.Context(), companyID, limit, offset)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch company bookings",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"bookings": bookings,
		"total":    total,
		"limit":    limit,
		"offset":   offset,
	})
}

// CreatePayPalCheckout returns the PayPal approval URL for a pending, unpaid booking.
// POST /api/v1/bookings/:id/paypal/checkout
func (h *BookingHandler) CreatePayPalCheckout(c *fiber.Ctx) error {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid booking ID",
		})
	}
	url, err := h.bookingService.CreatePayPalCheckout(c.Context(), userID, id)
	if err != nil {
		switch {
		case errors.Is(err, booking.ErrPayPalNotConfigured):
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
				"error": "PayPal is not configured",
			})
		case errors.Is(err, booking.ErrBookingNotFound):
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Booking not found",
			})
		case errors.Is(err, booking.ErrUnauthorizedBookingGet), errors.Is(err, booking.ErrPayPalNotEligible):
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Booking is not eligible for payment",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to start PayPal checkout",
		})
	}
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"approval_url": url,
	})
}

// CapturePayPal finalizes the payment after the buyer returns from PayPal.
// POST /api/v1/bookings/paypal/capture
func (h *BookingHandler) CapturePayPal(c *fiber.Ctx) error {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized",
		})
	}
	var body struct {
		PaypalOrderID string `json:"paypal_order_id"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}
	if body.PaypalOrderID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "paypal_order_id is required",
		})
	}
	bookingObj, err := h.bookingService.CapturePayPalOrder(c.Context(), userID, body.PaypalOrderID)
	if err != nil {
		switch {
		case errors.Is(err, booking.ErrPayPalNotConfigured):
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
				"error": "PayPal is not configured",
			})
		case errors.Is(err, booking.ErrBookingNotFound):
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Booking not found",
			})
		case errors.Is(err, booking.ErrUnauthorizedBookingGet):
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "Not allowed to complete this payment",
			})
		case errors.Is(err, booking.ErrInvalidBookingStatus):
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "This booking is not awaiting payment",
			})
		case errors.Is(err, booking.ErrPayPalAmountMismatch):
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Payment amount does not match the booking; contact support",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to complete payment",
		})
	}
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Payment successful",
		"booking": bookingObj,
	})
}
