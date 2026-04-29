package booking

import (
	"backend/internal/models"
	"backend/internal/polarapp"
	"context"
	"errors"
	"fmt"
	"math"
	"strings"

	"github.com/google/uuid"
	polarco "github.com/polarsource/polar-go/models/components"
	"gorm.io/gorm"
)

var (
	ErrPolarNotConfigured  = errors.New("polar is not configured")
	ErrPolarNotEligible    = errors.New("booking is not eligible for polar checkout")
	ErrPolarAmountMismatch = errors.New("polar amount does not match booking")
)

func metadataBookingID(m map[string]polarco.MetadataOutputType) (uuid.UUID, bool) {
	v, ok := m["booking_id"]
	if !ok {
		return uuid.Nil, false
	}
	if v.Type != polarco.MetadataOutputTypeTypeStr || v.Str == nil {
		return uuid.Nil, false
	}
	id, err := uuid.Parse(strings.TrimSpace(*v.Str))
	if err != nil {
		return uuid.Nil, false
	}
	return id, true
}

func (s *service) CreatePolarCheckout(ctx context.Context, userID uuid.UUID, bookingID uuid.UUID) (checkoutURL string, err error) {
	if s.polar == nil {
		return "", ErrPolarNotConfigured
	}
	var booking *models.Booking
	var tour *models.Tour
	err = s.txMgr.WithTransaction(ctx, func(txCtx context.Context) error {
		b, err := s.bookingRepo.GetByID(txCtx, bookingID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrBookingNotFound
			}
			return err
		}
		if b.UserID != userID {
			return ErrUnauthorizedBookingGet
		}
		if b.Status != models.BookingStatusPending {
			return ErrPolarNotEligible
		}
		if b.PaypalCaptureID != nil || b.PolarOrderID != nil {
			return ErrPolarNotEligible
		}
		t, err := s.tourRepo.GetByID(txCtx, b.TourID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrTourNotFound
			}
			return err
		}
		booking = b
		tour = t
		return nil
	})
	if err != nil {
		return "", err
	}
	pcurr, err := polarapp.Presentment(tour.Currency)
	if err != nil {
		return "", err
	}
	base := appBaseURL()
	success := fmt.Sprintf("%s/bookings/payment/polar-return?checkout_id={CHECKOUT_ID}", base)
	ret := fmt.Sprintf("%s/bookings/new?tour=%d", base, booking.TourID)
	ch, err := s.polar.CreateCheckoutSession(
		ctx,
		booking.TotalPrice,
		pcurr,
		bookingID,
		success,
		ret,
		booking.ContactEmail,
	)
	if err != nil {
		return "", err
	}
	cid := ch.ID
	err = s.txMgr.WithTransaction(ctx, func(txCtx context.Context) error {
		b, err := s.bookingRepo.GetByID(txCtx, bookingID)
		if err != nil {
			return err
		}
		b.PolarCheckoutID = &cid
		return s.bookingRepo.Update(txCtx, b)
	})
	if err != nil {
		return "", err
	}
	return ch.URL, nil
}

// SyncPolarAfterReturn fetches the order for this checkout; confirms the booking when the order is paid.
func (s *service) SyncPolarAfterReturn(ctx context.Context, userID uuid.UUID, checkoutID string) (*models.Booking, error) {
	if s.polar == nil {
		return nil, ErrPolarNotConfigured
	}
	if checkoutID == "" {
		return nil, fmt.Errorf("missing checkout id")
	}
	ch, err := s.polar.GetCheckout(ctx, checkoutID)
	if err != nil {
		return nil, err
	}
	if ch.Status != polarco.CheckoutStatusSucceeded {
		return nil, fmt.Errorf("checkout not complete: %s", ch.Status)
	}
	order, err := s.polar.GetOrderByCheckoutID(ctx, checkoutID)
	if err != nil {
		return nil, err
	}
	if order == nil {
		return nil, fmt.Errorf("order not found for checkout yet; wait a moment or rely on the webhook")
	}
	bookingID, ok := metadataBookingID(order.Metadata)
	if !ok {
		return nil, fmt.Errorf("order has no booking_id metadata")
	}
	var out *models.Booking
	err = s.txMgr.WithTransaction(ctx, func(txCtx context.Context) error {
		booking, err := s.bookingRepo.GetByID(txCtx, bookingID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrBookingNotFound
			}
			return err
		}
		if booking.UserID != userID {
			return ErrUnauthorizedBookingGet
		}
		if err := s.applyPolarOrderInTx(txCtx, booking, order); err != nil {
			return err
		}
		updated, err := s.bookingRepo.GetByID(txCtx, bookingID)
		if err != nil {
			return err
		}
		out = updated
		return nil
	})
	if err != nil {
		return nil, err
	}
	return out, nil
}

// ProcessPolarOrderPaid applies a verified order.paid webhook.
func (s *service) ProcessPolarOrderPaid(ctx context.Context, order *polarco.Order) error {
	if order == nil {
		return fmt.Errorf("nil order")
	}
	bookingID, ok := metadataBookingID(order.Metadata)
	if !ok {
		return fmt.Errorf("order has no booking_id in metadata")
	}
	return s.txMgr.WithTransaction(ctx, func(txCtx context.Context) error {
		booking, err := s.bookingRepo.GetByID(txCtx, bookingID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrBookingNotFound
			}
			return err
		}
		return s.applyPolarOrderInTx(txCtx, booking, order)
	})
}

func (s *service) applyPolarOrderInTx(txCtx context.Context, booking *models.Booking, order *polarco.Order) error {
	if booking.PaypalCaptureID != nil {
		return fmt.Errorf("booking already paid with PayPal")
	}
	if booking.PolarOrderID != nil && *booking.PolarOrderID == order.ID && booking.Status == models.BookingStatusConfirmed {
		return nil
	}
	if booking.Status == models.BookingStatusConfirmed {
		return nil
	}
	if booking.Status != models.BookingStatusPending {
		return ErrInvalidBookingStatus
	}
	tour, err := s.tourRepo.GetByID(txCtx, booking.TourID)
	if err != nil {
		return err
	}
	pcurr, err := polarapp.Presentment(tour.Currency)
	if err != nil {
		return err
	}
	if !strings.EqualFold(string(pcurr), strings.TrimSpace(order.Currency)) {
		return ErrPolarAmountMismatch
	}
	expect := polarapp.MinorAmount(booking.TotalPrice)
	if order.GetTotalAmount() != expect {
		if int64(math.Abs(float64(order.GetTotalAmount()-expect))) > 1 {
			return ErrPolarAmountMismatch
		}
	}
	booking.PolarOrderID = &order.ID
	booking.Status = models.BookingStatusConfirmed
	if order.GetCheckoutID() != nil {
		if booking.PolarCheckoutID == nil {
			ck := *order.GetCheckoutID()
			booking.PolarCheckoutID = &ck
		}
	}
	return s.bookingRepo.Update(txCtx, booking)
}