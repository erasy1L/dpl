package booking

import (
	"backend/internal/models"
	"backend/internal/polarapp"
	"backend/internal/repository"
	"backend/pkg/paypal"
	"context"
	"errors"
	"fmt"
	"math"
	"os"
	"strconv"
	"strings"

	"github.com/google/uuid"
	polarco "github.com/polarsource/polar-go/models/components"
	"gorm.io/gorm"
)

var (
	ErrBookingNotFound         = errors.New("booking not found")
	ErrScheduleNotFound        = errors.New("schedule not found")
	ErrTourNotFound            = errors.New("tour not found")
	ErrInsufficientSpots       = errors.New("not enough available spots")
	ErrInvalidBookingStatus    = errors.New("booking cannot be modified in current status")
	ErrUnauthorizedBookingGet  = errors.New("not allowed to view this booking")
	ErrPayPalNotConfigured     = errors.New("paypal is not configured")
	ErrPayPalNotEligible       = errors.New("booking is not eligible for this payment")
	ErrPayPalAmountMismatch    = errors.New("payment amount does not match booking")
	ErrPaidBookingNonCancellable = errors.New("paid booking cannot be cancelled here")
)

type Service interface {
	Create(ctx context.Context, userID uuid.UUID, req *models.CreateBookingRequest) (*models.Booking, error)
	GetMyBookings(ctx context.Context, userID uuid.UUID, limit, offset int) ([]models.Booking, int64, error)
	GetByIDForUser(ctx context.Context, id uuid.UUID, userID uuid.UUID, isManagerOrAdmin bool) (*models.Booking, error)
	Cancel(ctx context.Context, id uuid.UUID, userID uuid.UUID, isManagerOrAdmin bool) (*models.Booking, error)
	GetCompanyBookings(ctx context.Context, companyID int, limit, offset int) ([]models.Booking, int64, error)
	CreatePayPalCheckout(ctx context.Context, userID uuid.UUID, bookingID uuid.UUID) (approvalURL string, err error)
	CapturePayPalOrder(ctx context.Context, userID uuid.UUID, payPalOrderID string) (*models.Booking, error)
	CreatePolarCheckout(ctx context.Context, userID uuid.UUID, bookingID uuid.UUID) (checkoutURL string, err error)
	SyncPolarAfterReturn(ctx context.Context, userID uuid.UUID, checkoutID string) (*models.Booking, error)
	ProcessPolarOrderPaid(ctx context.Context, order *polarco.Order) error
}

type service struct {
	bookingRepo BookingRepository
	tourRepo    repository.TourRepository
	txMgr       repository.TransactionManager
	paypal      *paypal.Client
	polar       *polarapp.Client
}

type BookingRepository interface {
	repository.BookingRepository
}

func NewService(
	bookingRepo BookingRepository,
	tourRepo repository.TourRepository,
	txMgr repository.TransactionManager,
	paypalClient *paypal.Client,
	polarClient *polarapp.Client,
) Service {
	return &service{
		bookingRepo: bookingRepo,
		tourRepo:    tourRepo,
		txMgr:       txMgr,
		paypal:      paypalClient,
		polar:       polarClient,
	}
}

func (s *service) Create(ctx context.Context, userID uuid.UUID, req *models.CreateBookingRequest) (*models.Booking, error) {
	var created *models.Booking

	err := s.txMgr.WithTransaction(ctx, func(txCtx context.Context) error {
		tour, err := s.tourRepo.GetByID(txCtx, req.TourID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrTourNotFound
			}
			return err
		}

		schedule, err := s.tourRepo.GetScheduleByID(txCtx, req.ScheduleID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrScheduleNotFound
			}
			return err
		}
		if schedule.TourID != tour.ID {
			return fmt.Errorf("schedule does not belong to tour")
		}
		if schedule.Status != "scheduled" {
			return ErrInvalidBookingStatus
		}
		if schedule.AvailableSpots < req.NumberOfPeople {
			return ErrInsufficientSpots
		}

		totalPrice := float64(req.NumberOfPeople) * tour.Price

		booking := &models.Booking{
			UserID:         userID,
			TourID:         tour.ID,
			ScheduleID:     schedule.ID,
			CompanyID:      tour.CompanyID,
			NumberOfPeople: req.NumberOfPeople,
			TotalPrice:     totalPrice,
			Status:         models.BookingStatusPending,
			ContactPhone:   req.ContactPhone,
			ContactEmail:   req.ContactEmail,
		}
		if req.Notes != "" {
			n := req.Notes
			booking.Notes = &n
		}

		if err := s.bookingRepo.Create(txCtx, booking); err != nil {
			return err
		}

		schedule.AvailableSpots -= req.NumberOfPeople
		if schedule.AvailableSpots <= 0 {
			schedule.AvailableSpots = 0
			schedule.Status = "full"
		}

		if err := s.tourRepo.UpdateSchedule(txCtx, schedule); err != nil {
			return err
		}

		created = booking
		return nil
	})

	if err != nil {
		return nil, err
	}
	return created, nil
}

func (s *service) GetMyBookings(ctx context.Context, userID uuid.UUID, limit, offset int) ([]models.Booking, int64, error) {
	return s.bookingRepo.ListByUser(ctx, userID, limit, offset)
}

func (s *service) GetByIDForUser(ctx context.Context, id uuid.UUID, userID uuid.UUID, isManagerOrAdmin bool) (*models.Booking, error) {
	booking, err := s.bookingRepo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrBookingNotFound
		}
		return nil, err
	}

	if booking.UserID != userID && !isManagerOrAdmin {
		return nil, ErrUnauthorizedBookingGet
	}

	return booking, nil
}

func (s *service) Cancel(ctx context.Context, id uuid.UUID, userID uuid.UUID, isManagerOrAdmin bool) (*models.Booking, error) {
	var updated *models.Booking

	err := s.txMgr.WithTransaction(ctx, func(txCtx context.Context) error {
		booking, err := s.bookingRepo.GetByID(txCtx, id)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrBookingNotFound
			}
			return err
		}

		if booking.UserID != userID && !isManagerOrAdmin {
			return ErrUnauthorizedBookingGet
		}

		if booking.PaypalCaptureID != nil {
			return ErrPaidBookingNonCancellable
		}
		if booking.PolarOrderID != nil {
			return ErrPaidBookingNonCancellable
		}

		if booking.Status != models.BookingStatusPending && booking.Status != models.BookingStatusConfirmed {
			return ErrInvalidBookingStatus
		}

		schedule, err := s.tourRepo.GetScheduleByID(txCtx, booking.ScheduleID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrScheduleNotFound
			}
			return err
		}

		schedule.AvailableSpots += booking.NumberOfPeople
		if schedule.Status == "full" {
			schedule.Status = "scheduled"
		}

		if err := s.tourRepo.UpdateSchedule(txCtx, schedule); err != nil {
			return err
		}

		booking.Status = models.BookingStatusCancelled
		if err := s.bookingRepo.Update(txCtx, booking); err != nil {
			return err
		}

		updated = booking
		return nil
	})

	if err != nil {
		return nil, err
	}

	return updated, nil
}

func (s *service) GetCompanyBookings(ctx context.Context, companyID int, limit, offset int) ([]models.Booking, int64, error) {
	return s.bookingRepo.ListByCompany(ctx, companyID, limit, offset)
}

func appBaseURL() string {
	if u := os.Getenv("APP_BASE_URL"); u != "" {
		return strings.TrimRight(u, "/")
	}
	return "http://localhost:5173"
}

func (s *service) CreatePayPalCheckout(ctx context.Context, userID uuid.UUID, bookingID uuid.UUID) (string, error) {
	if s.paypal == nil {
		return "", ErrPayPalNotConfigured
	}

	var approvalURL string
	err := s.txMgr.WithTransaction(ctx, func(txCtx context.Context) error {
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
		if booking.Status != models.BookingStatusPending {
			return ErrPayPalNotEligible
		}
		if booking.PaypalCaptureID != nil {
			return ErrPayPalNotEligible
		}

		tour, err := s.tourRepo.GetByID(txCtx, booking.TourID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrTourNotFound
			}
			return err
		}
		currency := strings.ToUpper(tour.Currency)
		if currency == "" {
			currency = "KZT"
		}
		amountStr := fmt.Sprintf("%.2f", booking.TotalPrice)

		base := appBaseURL()
		ret := fmt.Sprintf("%s/bookings/payment/paypal-return", base)
		cancel := fmt.Sprintf("%s/bookings/new?tour=%d&payment=cancelled", base, booking.TourID)

		req := paypal.CreateOrderInput{
			Amount:       amountStr,
			CurrencyCode: currency,
			ReferenceID:  bookingID.String(),
			ReturnURL:    ret,
			CancelURL:    cancel,
		}
		created, err := s.paypal.CreateOrder(txCtx, req)
		if err != nil {
			return err
		}
		oid := created.OrderID
		booking.PaypalOrderID = &oid
		if err := s.bookingRepo.Update(txCtx, booking); err != nil {
			return err
		}
		approvalURL = created.ApprovalURL
		return nil
	})
	if err != nil {
		return "", err
	}
	return approvalURL, nil
}

func (s *service) CapturePayPalOrder(ctx context.Context, userID uuid.UUID, payPalOrderID string) (*models.Booking, error) {
	if s.paypal == nil {
		return nil, ErrPayPalNotConfigured
	}
	if payPalOrderID == "" {
		return nil, fmt.Errorf("missing paypal order id")
	}

	var out *models.Booking
	err := s.txMgr.WithTransaction(ctx, func(txCtx context.Context) error {
		booking, err := s.bookingRepo.GetByPaypalOrderID(txCtx, payPalOrderID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrBookingNotFound
			}
			return err
		}
		if booking.UserID != userID {
			return ErrUnauthorizedBookingGet
		}
		if booking.Status != models.BookingStatusPending {
			return ErrInvalidBookingStatus
		}
		if booking.PaypalCaptureID != nil {
			out = booking
			return nil
		}

		capture, err := s.paypal.CaptureOrder(txCtx, payPalOrderID)
		if err != nil {
			// Concurrency/duplicate: another request may have completed capture first
			booking2, e2 := s.bookingRepo.GetByPaypalOrderID(txCtx, payPalOrderID)
			if e2 == nil && booking2 != nil && booking2.PaypalCaptureID != nil {
				out = booking2
				return nil
			}
			return err
		}
		if !strings.EqualFold(capture.Status, "COMPLETED") {
			return fmt.Errorf("paypal order not completed: %s", capture.Status)
		}

		tour, err := s.tourRepo.GetByID(txCtx, booking.TourID)
		if err != nil {
			return err
		}
		currency := strings.ToUpper(tour.Currency)
		if currency == "" {
			currency = "KZT"
		}
		if !strings.EqualFold(currency, capture.Currency) {
			return ErrPayPalAmountMismatch
		}
		paid, err := strconv.ParseFloat(capture.GrossValue, 64)
		if err != nil {
			return err
		}
		if math.Abs(paid-booking.TotalPrice) > 0.02 {
			return ErrPayPalAmountMismatch
		}

		cid := capture.CaptureID
		booking.PaypalCaptureID = &cid
		booking.Status = models.BookingStatusConfirmed
		if err := s.bookingRepo.Update(txCtx, booking); err != nil {
			return err
		}
		out = booking
		return nil
	})
	if err != nil {
		return nil, err
	}
	return out, nil
}

