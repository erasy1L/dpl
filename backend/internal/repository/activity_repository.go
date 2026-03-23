package repository

import (
	"backend/internal/models"
	"context"
	"encoding/json"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ActivityRepository interface {
	TrackActivity(ctx context.Context, activity *models.UserActivity) error
	GetUserActivities(ctx context.Context, userID uuid.UUID, activityType *models.ActivityType, limit, offset int) ([]*models.UserActivity, int64, error)
	GetAttractionViews(ctx context.Context, attractionID int) (int, error)
	GetUserFavorites(ctx context.Context, userID uuid.UUID) ([]int, error)
	IsFavorite(ctx context.Context, userID uuid.UUID, attractionID int) (bool, error)
	RemoveFavorite(ctx context.Context, userID uuid.UUID, attractionID int) error
	GetPopularAttractions(ctx context.Context, city *string, limit int) ([]*models.Attraction, error)
	GetTrendingAttractions(ctx context.Context, city *string, limit int) ([]*models.Attraction, error)
	GetAttractionStats(ctx context.Context, attractionID int) (*models.AttractionStatsView, error)
	RefreshStats(ctx context.Context) error
	UpdateTrendingScores(ctx context.Context) error
}

type activityRepository struct {
	db *gorm.DB
}

func NewActivityRepository(db *gorm.DB) ActivityRepository {
	return &activityRepository{db: db}
}

// TrackActivity - record user activity
func (r *activityRepository) TrackActivity(ctx context.Context, activity *models.UserActivity) error {
	return r.db.WithContext(ctx).Create(activity).Error
}

// GetUserActivities - get user's activity history
func (r *activityRepository) GetUserActivities(ctx context.Context, userID uuid.UUID, activityType *models.ActivityType, limit, offset int) ([]*models.UserActivity, int64, error) {
	var activities []*models.UserActivity
	var total int64

	query := r.db.WithContext(ctx).Model(&models.UserActivity{}).Where("user_id = ?", userID)

	if activityType != nil {
		query = query.Where("activity_type = ?", *activityType)
	}

	// Get total count
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated activities with attraction info
	err := query.
		Preload("Attraction").
		Preload("Attraction.Categories").
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&activities).Error

	if err != nil {
		return nil, 0, err
	}

	return activities, total, nil
}

// GetAttractionViews - get view count for attraction
func (r *activityRepository) GetAttractionViews(ctx context.Context, attractionID int) (int, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&models.UserActivity{}).
		Where("attraction_id = ? AND activity_type = ?", attractionID, models.ActivityTypeView).
		Count(&count).Error

	return int(count), err
}

// GetUserFavorites - get user's favorited attractions
func (r *activityRepository) GetUserFavorites(ctx context.Context, userID uuid.UUID) ([]int, error) {
	var favorites []int
	err := r.db.WithContext(ctx).
		Model(&models.UserActivity{}).
		Where("user_id = ? AND activity_type = ?", userID, models.ActivityTypeFavorite).
		Pluck("attraction_id", &favorites).Error

	return favorites, err
}

// IsFavorite - check if user favorited attraction
func (r *activityRepository) IsFavorite(ctx context.Context, userID uuid.UUID, attractionID int) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&models.UserActivity{}).
		Where("user_id = ? AND attraction_id = ? AND activity_type = ?", userID, attractionID, models.ActivityTypeFavorite).
		Count(&count).Error

	return count > 0, err
}

// RemoveFavorite - remove from favorites
func (r *activityRepository) RemoveFavorite(ctx context.Context, userID uuid.UUID, attractionID int) error {
	return r.db.WithContext(ctx).
		Where("user_id = ? AND attraction_id = ? AND activity_type = ?", userID, attractionID, models.ActivityTypeFavorite).
		Delete(&models.UserActivity{}).Error
}

// GetPopularAttractions - get attractions by views
func (r *activityRepository) GetPopularAttractions(ctx context.Context, city *string, limit int) ([]*models.Attraction, error) {
	var attractions []*models.Attraction

	query := r.db.WithContext(ctx).
		Model(&models.Attraction{}).
		Preload("Categories")

	if city != nil && *city != "" {
		query = query.Where("city::text ILIKE ?", "%"+*city+"%")
	}

	err := query.
		Order("total_views DESC NULLS LAST, average_rating DESC NULLS LAST").
		Limit(limit).
		Find(&attractions).Error

	return attractions, err
}

// GetTrendingAttractions - get trending attractions
func (r *activityRepository) GetTrendingAttractions(ctx context.Context, city *string, limit int) ([]*models.Attraction, error) {
	var attractions []*models.Attraction

	query := r.db.WithContext(ctx).
		Model(&models.Attraction{}).
		Preload("Categories")

	if city != nil && *city != "" {
		query = query.Where("city::text ILIKE ?", "%"+*city+"%")
	}

	err := query.
		Order("trending_score DESC NULLS LAST, total_views DESC NULLS LAST").
		Limit(limit).
		Find(&attractions).Error

	return attractions, err
}

// GetAttractionStats - get stats for attraction from materialized view
func (r *activityRepository) GetAttractionStats(ctx context.Context, attractionID int) (*models.AttractionStatsView, error) {
	var stats models.AttractionStatsView
	err := r.db.WithContext(ctx).
		Table("attraction_stats").
		Where("attraction_id = ?", attractionID).
		First(&stats).Error

	if err != nil {
		return nil, err
	}

	return &stats, nil
}

// RefreshStats - refresh materialized view
func (r *activityRepository) RefreshStats(ctx context.Context) error {
	return r.db.WithContext(ctx).Exec("SELECT refresh_attraction_stats()").Error
}

// UpdateTrendingScores - calculate and update trending scores
func (r *activityRepository) UpdateTrendingScores(ctx context.Context) error {
	return r.db.WithContext(ctx).Exec("SELECT update_trending_scores()").Error
}

// Helper function to marshal metadata
func MarshalMetadata(data interface{}) (string, error) {
	if data == nil {
		return "", nil
	}
	bytes, err := json.Marshal(data)
	if err != nil {
		return "", err
	}
	return string(bytes), nil
}
