package repository

import (
	"backend/internal/models"
	"context"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserRepository interface {
	Create(ctx context.Context, user *models.User) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.User, error)
	GetByEmail(ctx context.Context, email string) (*models.User, error)
	GetByEmailVerificationToken(ctx context.Context, token string) (*models.User, error)
	GetByResetPasswordToken(ctx context.Context, token string) (*models.User, error)
	Update(ctx context.Context, user *models.User) error
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, limit, offset int) ([]models.User, error)
	Count(ctx context.Context) (int64, error)
	CountByRole(ctx context.Context, role models.UserRole) (int64, error)
	GetUserStats(ctx context.Context, userID uuid.UUID) (*models.UserStats, error)
}

type userRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) Create(ctx context.Context, user *models.User) error {
	return r.db.WithContext(ctx).Create(user).Error
}

func (r *userRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	var user models.User
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	var user models.User
	err := r.db.WithContext(ctx).Where("email = ?", email).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) GetByEmailVerificationToken(ctx context.Context, token string) (*models.User, error) {
	var user models.User
	err := r.db.WithContext(ctx).
		Where("email_verification_token = ?", token).
		First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) GetByResetPasswordToken(ctx context.Context, token string) (*models.User, error) {
	var user models.User
	err := r.db.WithContext(ctx).
		Where("reset_password_token = ?", token).
		First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) Update(ctx context.Context, user *models.User) error {
	return r.db.WithContext(ctx).Save(user).Error
}

func (r *userRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&models.User{}, "id = ?", id).Error
}

func (r *userRepository) List(ctx context.Context, limit, offset int) ([]models.User, error) {
	var users []models.User
	err := r.db.WithContext(ctx).Limit(limit).Offset(offset).Find(&users).Error
	return users, err
}

func (r *userRepository) Count(ctx context.Context) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&models.User{}).Count(&count).Error
	return count, err
}

func (r *userRepository) CountByRole(ctx context.Context, role models.UserRole) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&models.User{}).
		Where("role = ?", role).
		Count(&count).
		Error
	return count, err
}

func (r *userRepository) GetUserStats(ctx context.Context, userID uuid.UUID) (*models.UserStats, error) {
	var stats models.UserStats

	// Count unique attractions visited (from user_activities with type 'view')
	var attractionsVisited int64
	err := r.db.WithContext(ctx).
		Model(&models.UserActivity{}).
		Where("user_id = ? AND activity_type = ?", userID, models.ActivityTypeView).
		Distinct("attraction_id").
		Count(&attractionsVisited).Error
	if err != nil {
		return nil, err
	}
	stats.AttractionsVisited = int(attractionsVisited)

	// Count reviews written (from ratings table)
	var reviewsWritten int64
	err = r.db.WithContext(ctx).
		Model(&models.Rating{}).
		Where("user_id = ?", userID).
		Count(&reviewsWritten).Error
	if err != nil {
		return nil, err
	}
	stats.ReviewsWritten = int(reviewsWritten)

	// Calculate average rating given by user
	var avgRating float64
	err = r.db.WithContext(ctx).
		Model(&models.Rating{}).
		Where("user_id = ?", userID).
		Select("COALESCE(AVG(rating), 0)").
		Scan(&avgRating).Error
	if err != nil {
		return nil, err
	}
	stats.AverageRating = avgRating

	return &stats, nil
}
