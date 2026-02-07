package rating

import (
	"backend/internal/models"
	"backend/internal/repository"
	"context"
	"errors"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

var (
	ErrRatingNotFound     = errors.New("rating not found")
	ErrUnauthorized       = errors.New("unauthorized to perform this action")
	ErrAttractionNotFound = errors.New("attraction not found")
	ErrInvalidRatingValue = errors.New("rating must be between 1 and 5")
)

type Service interface {
	CreateOrUpdate(ctx context.Context, userID uuid.UUID, req *models.CreateRatingRequest) (*models.Rating, error)
	GetAttractionRatings(ctx context.Context, attractionID int, limit, offset int) ([]*models.Rating, int64, error)
	GetUserRatings(ctx context.Context, userID uuid.UUID) ([]*models.Rating, error)
	GetUserRatingForAttraction(ctx context.Context, userID uuid.UUID, attractionID int) (*models.Rating, error)
	UpdateRating(ctx context.Context, ratingID int, userID uuid.UUID, req *models.UpdateRatingRequest) error
	DeleteRating(ctx context.Context, ratingID int, userID uuid.UUID) error
	GetAttractionStats(ctx context.Context, attractionID int) (avgRating float64, count int64, err error)
}

type service struct {
	ratingRepo     repository.RatingRepository
	attractionRepo repository.AttractionRepository
}

func NewService(ratingRepo repository.RatingRepository, attractionRepo repository.AttractionRepository) Service {
	return &service{
		ratingRepo:     ratingRepo,
		attractionRepo: attractionRepo,
	}
}

// CreateOrUpdate - create new rating or update existing
func (s *service) CreateOrUpdate(ctx context.Context, userID uuid.UUID, req *models.CreateRatingRequest) (*models.Rating, error) {
	// Validate rating value
	if req.Rating < 1 || req.Rating > 5 {
		return nil, ErrInvalidRatingValue
	}

	// Check if attraction exists
	_, err := s.attractionRepo.GetByID(ctx, req.AttractionID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrAttractionNotFound
		}
		return nil, err
	}

	// Create rating object
	rating := &models.Rating{
		UserID:       userID,
		AttractionID: req.AttractionID,
		Rating:       req.Rating,
		Review:       req.Review,
	}

	// Create or update rating
	if err := s.ratingRepo.Create(ctx, rating); err != nil {
		return nil, err
	}

	// Fetch the created/updated rating with user info
	return s.ratingRepo.GetByUserAndAttraction(ctx, userID, req.AttractionID)
}

// GetAttractionRatings - get paginated ratings for an attraction
func (s *service) GetAttractionRatings(ctx context.Context, attractionID int, limit, offset int) ([]*models.Rating, int64, error) {
	// Set default limit if not provided
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}

	return s.ratingRepo.GetByAttraction(ctx, attractionID, limit, offset)
}

// GetUserRatings - get all ratings by a user
func (s *service) GetUserRatings(ctx context.Context, userID uuid.UUID) ([]*models.Rating, error) {
	return s.ratingRepo.GetByUser(ctx, userID)
}

// GetUserRatingForAttraction - check if user already rated this attraction
func (s *service) GetUserRatingForAttraction(ctx context.Context, userID uuid.UUID, attractionID int) (*models.Rating, error) {
	rating, err := s.ratingRepo.GetByUserAndAttraction(ctx, userID, attractionID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrRatingNotFound
		}
		return nil, err
	}
	return rating, nil
}

// UpdateRating - update existing rating (only owner can update)
func (s *service) UpdateRating(ctx context.Context, ratingID int, userID uuid.UUID, req *models.UpdateRatingRequest) error {
	// Validate rating value
	if req.Rating < 1 || req.Rating > 5 {
		return ErrInvalidRatingValue
	}

	// Get existing rating
	rating, err := s.ratingRepo.GetByID(ctx, ratingID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrRatingNotFound
		}
		return err
	}

	// Check if user is the owner
	if rating.UserID != userID {
		return ErrUnauthorized
	}

	// Update fields
	rating.Rating = req.Rating
	rating.Review = req.Review

	return s.ratingRepo.Update(ctx, rating)
}

// DeleteRating - delete rating (only owner can delete)
func (s *service) DeleteRating(ctx context.Context, ratingID int, userID uuid.UUID) error {
	// Get existing rating
	rating, err := s.ratingRepo.GetByID(ctx, ratingID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrRatingNotFound
		}
		return err
	}

	// Check if user is the owner
	if rating.UserID != userID {
		return ErrUnauthorized
	}

	return s.ratingRepo.Delete(ctx, ratingID)
}

// GetAttractionStats - get average rating and count for attraction
func (s *service) GetAttractionStats(ctx context.Context, attractionID int) (avgRating float64, count int64, err error) {
	return s.ratingRepo.GetAttractionStats(ctx, attractionID)
}
