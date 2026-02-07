package repository

import (
	"backend/internal/models"
	"context"
	"errors"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type RatingRepository interface {
	Create(ctx context.Context, rating *models.Rating) error
	GetByID(ctx context.Context, id int) (*models.Rating, error)
	GetByUserAndAttraction(ctx context.Context, userID uuid.UUID, attractionID int) (*models.Rating, error)
	GetByAttraction(ctx context.Context, attractionID int, limit, offset int) ([]*models.Rating, int64, error)
	GetByUser(ctx context.Context, userID uuid.UUID) ([]*models.Rating, error)
	Update(ctx context.Context, rating *models.Rating) error
	Delete(ctx context.Context, id int) error
	GetAttractionStats(ctx context.Context, attractionID int) (avgRating float64, count int64, err error)
	GetDB() *gorm.DB
}

type ratingRepository struct {
	db *gorm.DB
}

func NewRatingRepository(db *gorm.DB) RatingRepository {
	return &ratingRepository{db: db}
}

// Create - creates or updates a rating (upsert)
func (r *ratingRepository) Create(ctx context.Context, rating *models.Rating) error {
	// Check if rating already exists
	var existing models.Rating
	err := r.db.WithContext(ctx).
		Where("user_id = ? AND attraction_id = ?", rating.UserID, rating.AttractionID).
		First(&existing).Error

	if err == nil {
		// Rating exists, update it
		existing.Rating = rating.Rating
		existing.Review = rating.Review
		return r.db.WithContext(ctx).Save(&existing).Error
	} else if errors.Is(err, gorm.ErrRecordNotFound) {
		// Rating doesn't exist, create new
		return r.db.WithContext(ctx).Create(rating).Error
	}

	return err
}

// GetByID - get rating by ID
func (r *ratingRepository) GetByID(ctx context.Context, id int) (*models.Rating, error) {
	var rating models.Rating
	err := r.db.WithContext(ctx).
		Preload("User").
		Preload("Attraction").
		Where("id = ?", id).
		First(&rating).Error
	if err != nil {
		return nil, err
	}
	return &rating, nil
}

// GetByUserAndAttraction - get specific user's rating for attraction
func (r *ratingRepository) GetByUserAndAttraction(ctx context.Context, userID uuid.UUID, attractionID int) (*models.Rating, error) {
	var rating models.Rating
	err := r.db.WithContext(ctx).
		Where("user_id = ? AND attraction_id = ?", userID, attractionID).
		First(&rating).Error
	if err != nil {
		return nil, err
	}
	return &rating, nil
}

// GetByAttraction - get all ratings for an attraction with user info
func (r *ratingRepository) GetByAttraction(ctx context.Context, attractionID int, limit, offset int) ([]*models.Rating, int64, error) {
	var ratings []*models.Rating
	var total int64

	// Get total count
	if err := r.db.WithContext(ctx).
		Model(&models.Rating{}).
		Where("attraction_id = ?", attractionID).
		Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated ratings with user info
	err := r.db.WithContext(ctx).
		Preload("User").
		Where("attraction_id = ?", attractionID).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&ratings).Error

	if err != nil {
		return nil, 0, err
	}

	return ratings, total, nil
}

// GetByUser - get all ratings by a user
func (r *ratingRepository) GetByUser(ctx context.Context, userID uuid.UUID) ([]*models.Rating, error) {
	var ratings []*models.Rating
	err := r.db.WithContext(ctx).
		Preload("Attraction").
		Preload("Attraction.Category").
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Find(&ratings).Error

	if err != nil {
		return nil, err
	}

	return ratings, nil
}

// Update - update existing rating
func (r *ratingRepository) Update(ctx context.Context, rating *models.Rating) error {
	return r.db.WithContext(ctx).Save(rating).Error
}

// Delete - delete rating
func (r *ratingRepository) Delete(ctx context.Context, id int) error {
	return r.db.WithContext(ctx).Delete(&models.Rating{}, id).Error
}

// GetAttractionStats - get average rating and count for attraction
func (r *ratingRepository) GetAttractionStats(ctx context.Context, attractionID int) (avgRating float64, count int64, err error) {
	type Result struct {
		AvgRating float64
		Count     int64
	}

	var result Result
	err = r.db.WithContext(ctx).
		Model(&models.Rating{}).
		Select("COALESCE(AVG(rating), 0) as avg_rating, COUNT(*) as count").
		Where("attraction_id = ?", attractionID).
		Scan(&result).Error

	return result.AvgRating, result.Count, err
}

// GetDB - returns the database instance
func (r *ratingRepository) GetDB() *gorm.DB {
	return r.db
}
