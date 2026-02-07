package activity

import (
	"backend/internal/models"
	"backend/internal/repository"
	"context"
	"errors"
	"log"

	"github.com/google/uuid"
	"github.com/lib/pq"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

var (
	ErrAttractionNotFound  = errors.New("attraction not found")
	ErrPreferencesNotFound = errors.New("preferences not found")
)

type Service interface {
	TrackView(ctx context.Context, userID *uuid.UUID, attractionID int) error
	AddFavorite(ctx context.Context, userID uuid.UUID, attractionID int) error
	RemoveFavorite(ctx context.Context, userID uuid.UUID, attractionID int) error
	GetUserFavorites(ctx context.Context, userID uuid.UUID) ([]int, error)
	IsFavorite(ctx context.Context, userID uuid.UUID, attractionID int) (bool, error)
	TrackShare(ctx context.Context, userID *uuid.UUID, attractionID int, platform string) error
	GetUserActivity(ctx context.Context, userID uuid.UUID, activityType *models.ActivityType, limit, offset int) ([]*models.UserActivity, int64, error)
	GetPopular(ctx context.Context, city *string, limit int) ([]*models.Attraction, error)
	GetTrending(ctx context.Context, city *string, limit int) ([]*models.Attraction, error)
	GetPreferences(ctx context.Context, userID uuid.UUID) (*models.UserPreferences, error)
	UpdatePreferences(ctx context.Context, userID uuid.UUID, req *models.UpdatePreferencesRequest) error
}

type service struct {
	activityRepo   repository.ActivityRepository
	prefsRepo      repository.UserPreferencesRepository
	attractionRepo repository.AttractionRepository
}

func NewService(activityRepo repository.ActivityRepository, prefsRepo repository.UserPreferencesRepository, attractionRepo repository.AttractionRepository) Service {
	return &service{
		activityRepo:   activityRepo,
		prefsRepo:      prefsRepo,
		attractionRepo: attractionRepo,
	}
}

// TrackView - record attraction view (can be anonymous)
func (s *service) TrackView(ctx context.Context, userID *uuid.UUID, attractionID int) error {
	// Check if attraction exists
	_, err := s.attractionRepo.GetByID(ctx, attractionID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrAttractionNotFound
		}
		return err
	}

	activity := &models.UserActivity{
		UserID:       userID,
		AttractionID: attractionID,
		ActivityType: models.ActivityTypeView,
	}

	s.activityRepo.TrackActivity(ctx, activity)

	err = s.attractionRepo.IncrementViews(ctx, attractionID)
	if err != nil {
		log.Printf("Failed to increment views for attraction %d: %v", attractionID, err)
		return err
	}
	return nil
}

// AddFavorite - add to favorites
func (s *service) AddFavorite(ctx context.Context, userID uuid.UUID, attractionID int) error {
	// Check if attraction exists
	_, err := s.attractionRepo.GetByID(ctx, attractionID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrAttractionNotFound
		}
		return err
	}

	// Check if already favorited
	isFav, err := s.activityRepo.IsFavorite(ctx, userID, attractionID)
	if err != nil {
		return err
	}

	if isFav {
		return nil // Already favorited, no error
	}

	activity := &models.UserActivity{
		UserID:       &userID,
		AttractionID: attractionID,
		ActivityType: models.ActivityTypeFavorite,
	}

	return s.activityRepo.TrackActivity(ctx, activity)
}

// RemoveFavorite - remove from favorites
func (s *service) RemoveFavorite(ctx context.Context, userID uuid.UUID, attractionID int) error {
	return s.activityRepo.RemoveFavorite(ctx, userID, attractionID)
}

// GetUserFavorites - get user's favorite attractions
func (s *service) GetUserFavorites(ctx context.Context, userID uuid.UUID) ([]int, error) {
	return s.activityRepo.GetUserFavorites(ctx, userID)
}

// IsFavorite - check if favorited
func (s *service) IsFavorite(ctx context.Context, userID uuid.UUID, attractionID int) (bool, error) {
	return s.activityRepo.IsFavorite(ctx, userID, attractionID)
}

// TrackShare - record share activity
func (s *service) TrackShare(ctx context.Context, userID *uuid.UUID, attractionID int, platform string) error {
	// Check if attraction exists
	_, err := s.attractionRepo.GetByID(ctx, attractionID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrAttractionNotFound
		}
		return err
	}

	// Create metadata with platform info
	metadata := ""
	if platform != "" {
		metadata, _ = repository.MarshalMetadata(map[string]string{"platform": platform})
	}

	activity := &models.UserActivity{
		UserID:       userID,
		AttractionID: attractionID,
		ActivityType: models.ActivityTypeShare,
		Metadata:     datatypes.JSON(metadata),
	}

	return s.activityRepo.TrackActivity(ctx, activity)
}

// GetUserActivity - get user's activity timeline
func (s *service) GetUserActivity(ctx context.Context, userID uuid.UUID, activityType *models.ActivityType, limit, offset int) ([]*models.UserActivity, int64, error) {
	// Set default limit if not provided
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}

	return s.activityRepo.GetUserActivities(ctx, userID, activityType, limit, offset)
}

// GetPopular - get popular attractions
func (s *service) GetPopular(ctx context.Context, city *string, limit int) ([]*models.Attraction, error) {
	if limit <= 0 {
		limit = 10
	}
	if limit > 50 {
		limit = 50
	}

	return s.activityRepo.GetPopularAttractions(ctx, city, limit)
}

// GetTrending - get trending attractions
func (s *service) GetTrending(ctx context.Context, city *string, limit int) ([]*models.Attraction, error) {
	if limit <= 0 {
		limit = 10
	}
	if limit > 50 {
		limit = 50
	}

	return s.activityRepo.GetTrendingAttractions(ctx, city, limit)
}

// GetPreferences - get user preferences
func (s *service) GetPreferences(ctx context.Context, userID uuid.UUID) (*models.UserPreferences, error) {
	prefs, err := s.prefsRepo.GetPreferences(ctx, userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrPreferencesNotFound
		}
		return nil, err
	}
	return prefs, nil
}

// UpdatePreferences - update user preferences
func (s *service) UpdatePreferences(ctx context.Context, userID uuid.UUID, req *models.UpdatePreferencesRequest) error {
	prefs := &models.UserPreferences{
		UserID: userID,
		PreferredCategories: func(src []int) pq.Int64Array {
			dst := make(pq.Int64Array, len(src))
			for i, v := range src {
				dst[i] = int64(v)
			}
			return dst
		}(req.PreferredCategories),
		PreferredCities: pq.StringArray(req.PreferredCities),
	}

	return s.prefsRepo.CreateOrUpdatePreferences(ctx, prefs)
}
