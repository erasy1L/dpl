package booking

import (
	"backend/internal/models"
	"backend/internal/polarapp"
	"backend/internal/repository"
	"context"
	"errors"
	"fmt"
	"os"
	"strings"

	"github.com/google/uuid"
	polarco "github.com/polarsource/polar-go/models/components"
	"gorm.io/gorm"
)

var (
	ErrBookingNotFound           = errors.New("booking not found")
	ErrScheduleNotFound          = errors.New("schedule not found")
	ErrTourNotFound              = errors.New("tour not found")
	ErrInsufficientSpots         = errors.New("not enough available spots")
	ErrInvalidBookingStatus      = errors.New("booking cannot be modified in current status")
	ErrUnauthorizedBookingGet    = errors.New("not allowed to view this booking")
	ErrPaidBookingNonCancellable = errors.New("paid booking cannot be cancelled here")
)

type Service interface {
	Create(ctx context.Context, userID uuid.UUID, req *models.CreateBookingRequest) (*models.Booking, error)
	GetMyBookings(ctx context.Context, userID uuid.UUID, limit, offset int) ([]models.Booking, int64, error)
	GetByIDForUser(ctx context.Context, id uuid.UUID, userID uuid.UUID, isManagerOrAdmin bool) (*models.Booking, error)
	Cancel(ctx context.Context, id uuid.UUID, userID uuid.UUID, isManagerOrAdmin bool) (*models.Booking, error)
	GetCompanyBookings(ctx context.Context, companyID int, limit, offset int) ([]models.Booking, int64, error)
	CreatePolarCheckout(ctx context.Context, userID uuid.UUID, bookingID uuid.UUID) (checkoutURL string, err error)
	SyncPolarAfterReturn(ctx context.Context, userID uuid.UUID, checkoutID string) (*models.Booking, error)
	ProcessPolarOrderPaid(ctx context.Context, order *polarco.Order) error
}

type service struct {
	bookingRepo BookingRepository
	tourRepo    repository.TourRepository
	txMgr       repository.TransactionManager
	polar       *polarapp.Client
}

type BookingRepository interface {
	repository.BookingRepository
}

func NewService(
	bookingRepo BookingRepository,
	tourRepo repository.TourRepository,
	txMgr repository.TransactionManager,
	polarClient *polarapp.Client,
) Service {
	return &service{
		bookingRepo: bookingRepo,
		tourRepo:    tourRepo,
		txMgr:       txMgr,
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