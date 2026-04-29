package repository

import (
	"backend/internal/models"
	"context"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type BookingRepository interface {
	Create(ctx context.Context, booking *models.Booking) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.Booking, error)
	GetByPaypalOrderID(ctx context.Context, orderID string) (*models.Booking, error)
	GetByPolarCheckoutID(ctx context.Context, checkoutID string) (*models.Booking, error)
	ListByUser(ctx context.Context, userID uuid.UUID, limit, offset int) ([]models.Booking, int64, error)
	ListByCompany(ctx context.Context, companyID int, limit, offset int) ([]models.Booking, int64, error)
	Update(ctx context.Context, booking *models.Booking) error
}

type bookingRepository struct {
	db *gorm.DB
}

func NewBookingRepository(db *gorm.DB) BookingRepository {
	return &bookingRepository{db: db}
}

func (r *bookingRepository) withDB(ctx context.Context) *gorm.DB {
	return GetDB(ctx, r.db)
}

func (r *bookingRepository) Create(ctx context.Context, booking *models.Booking) error {
	return r.withDB(ctx).Create(booking).Error
}

func (r *bookingRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Booking, error) {
	db := r.withDB(ctx)
	var booking models.Booking
	err := db.
		Preload("Tour").
		Preload("Tour.Company").
		Preload("Schedule").
		Where("id = ?", id).
		First(&booking).Error
	if err != nil {
		return nil, err
	}
	return &booking, nil
}

func (r *bookingRepository) GetByPaypalOrderID(ctx context.Context, orderID string) (*models.Booking, error) {
	db := r.withDB(ctx)
	var booking models.Booking
	err := db.
		Preload("Tour").
		Preload("Tour.Company").
		Preload("Schedule").
		Where("paypal_order_id = ?", orderID).
		First(&booking).Error
	if err != nil {
		return nil, err
	}
	return &booking, nil
}

func (r *bookingRepository) GetByPolarCheckoutID(ctx context.Context, checkoutID string) (*models.Booking, error) {
	db := r.withDB(ctx)
	var booking models.Booking
	err := db.
		Preload("Tour").
		Preload("Tour.Company").
		Preload("Schedule").
		Where("polar_checkout_id = ?", checkoutID).
		First(&booking).Error
	if err != nil {
		return nil, err
	}
	return &booking, nil
}

func (r *bookingRepository) ListByUser(ctx context.Context, userID uuid.UUID, limit, offset int) ([]models.Booking, int64, error) {
	db := r.withDB(ctx)
	var bookings []models.Booking
	var total int64

	query := db.Model(&models.Booking{}).Where("user_id = ?", userID)

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if limit > 0 {
		query = query.Limit(limit)
	}
	if offset > 0 {
		query = query.Offset(offset)
	}

	if err := query.
		Preload("Tour").
		Preload("Tour.Company").
		Preload("Schedule").
		Order("created_at DESC").
		Find(&bookings).Error; err != nil {
		return nil, 0, err
	}

	return bookings, total, nil
}

func (r *bookingRepository) ListByCompany(ctx context.Context, companyID int, limit, offset int) ([]models.Booking, int64, error) {
	db := r.withDB(ctx)
	var bookings []models.Booking
	var total int64

	query := db.Model(&models.Booking{}).Where("company_id = ?", companyID)

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if limit > 0 {
		query = query.Limit(limit)
	}
	if offset > 0 {
		query = query.Offset(offset)
	}

	if err := query.
		Preload("Tour").
		Preload("Tour.Company").
		Preload("Schedule").
		Order("created_at DESC").
		Find(&bookings).Error; err != nil {
		return nil, 0, err
	}

	return bookings, total, nil
}

func (r *bookingRepository) Update(ctx context.Context, booking *models.Booking) error {
	return r.withDB(ctx).Save(booking).Error
}

