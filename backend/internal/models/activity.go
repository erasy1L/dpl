package models

import (
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
	"gorm.io/datatypes"
)

// ActivityType represents the type of user activity
type ActivityType string

const (
	ActivityTypeView     ActivityType = "view"
	ActivityTypeFavorite ActivityType = "favorite"
	ActivityTypeShare    ActivityType = "share"
)

// UserActivity represents a user's interaction with an attraction
type UserActivity struct {
	ID           int            `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID       *uuid.UUID     `json:"user_id,omitempty" gorm:"type:uuid;index"`
	AttractionID int            `json:"attraction_id" gorm:"not null;index" validate:"required"`
	ActivityType ActivityType   `json:"activity_type" gorm:"type:varchar(20);not null" validate:"required"`
	Metadata     datatypes.JSON `json:"metadata,omitempty" gorm:"type:jsonb"`
	CreatedAt    time.Time      `json:"created_at" gorm:"default:CURRENT_TIMESTAMP;index"`

	User       *User       `json:"user,omitempty" gorm:"foreignKey:UserID;references:ID"`
	Attraction *Attraction `json:"attraction,omitempty" gorm:"foreignKey:AttractionID;references:ID"`
}

// TableName specifies the table name for UserActivity model
func (UserActivity) TableName() string {
	return "user_activities"
}

// CreateActivityRequest represents the request body for creating a new activity
type CreateActivityRequest struct {
	AttractionID int          `json:"attraction_id" validate:"required"`
	ActivityType ActivityType `json:"activity_type" validate:"required"`
	Metadata     string       `json:"metadata,omitempty"`
}

// UserPreferences represents a user's preferences for categories and cities
type UserPreferences struct {
	UserID              uuid.UUID      `json:"user_id" gorm:"type:uuid;primaryKey"`
	PreferredCategories pq.Int64Array  `json:"preferred_categories" gorm:"type:int[]"`
	PreferredCities     pq.StringArray `json:"preferred_cities" gorm:"type:varchar[]"`
	CreatedAt           time.Time      `json:"created_at" gorm:"default:CURRENT_TIMESTAMP"`
	UpdatedAt           time.Time      `json:"updated_at" gorm:"default:CURRENT_TIMESTAMP"`

	User *User `json:"user,omitempty" gorm:"foreignKey:UserID;references:ID"`
}

// TableName specifies the table name for UserPreferences model
func (UserPreferences) TableName() string {
	return "user_preferences"
}

// UpdatePreferencesRequest represents the request body for updating user preferences
type UpdatePreferencesRequest struct {
	PreferredCategories []int    `json:"preferred_categories"`
	PreferredCities     []string `json:"preferred_cities"`
}

// AttractionStatsView represents aggregated statistics from materialized view
type AttractionStatsView struct {
	AttractionID    int      `json:"attraction_id" gorm:"column:attraction_id"`
	UniqueViewers   int      `json:"unique_viewers" gorm:"column:unique_viewers"`
	TotalViews      int      `json:"total_views" gorm:"column:total_views"`
	TotalFavorites  int      `json:"total_favorites" gorm:"column:total_favorites"`
	ViewsLast7Days  int      `json:"views_last_7_days" gorm:"column:views_last_7_days"`
	ViewsLast30Days int      `json:"views_last_30_days" gorm:"column:views_last_30_days"`
	TotalRatings    int      `json:"total_ratings" gorm:"column:total_ratings"`
	AverageRating   *float64 `json:"average_rating" gorm:"column:average_rating"`
}

// AddFavoriteRequest represents the request body for adding a favorite
type AddFavoriteRequest struct {
	AttractionID int `json:"attraction_id" validate:"required"`
}

// TrackShareRequest represents the request body for tracking a share
type TrackShareRequest struct {
	Platform string `json:"platform,omitempty"`
}
