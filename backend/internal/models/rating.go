package models

import (
	"time"

	"github.com/google/uuid"
)

// Rating represents a user's rating and review of an attraction
type Rating struct {
	ID           int       `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID       uuid.UUID `json:"user_id" gorm:"type:uuid;not null;index" validate:"required"`
	AttractionID int       `json:"attraction_id" gorm:"not null;index" validate:"required"`
	Rating       int       `json:"rating" gorm:"type:int;not null;check:rating >= 1 AND rating <= 5" validate:"required,min=1,max=5"`
	Review       string    `json:"review,omitempty" gorm:"type:text"`
	CreatedAt    time.Time `json:"created_at" gorm:"default:CURRENT_TIMESTAMP"`
	UpdatedAt    time.Time `json:"updated_at" gorm:"default:CURRENT_TIMESTAMP"`

	User       *User       `json:"user,omitempty" gorm:"foreignKey:UserID;references:ID"`
	Attraction *Attraction `json:"attraction,omitempty" gorm:"foreignKey:AttractionID;references:ID"`
}

// TableName specifies the table name for Rating model
func (Rating) TableName() string {
	return "ratings"
}

// CreateRatingRequest represents the request body for creating a new rating
type CreateRatingRequest struct {
	AttractionID int    `json:"attraction_id" validate:"required"`
	Rating       int    `json:"rating" validate:"required,min=1,max=5"`
	Review       string `json:"review,omitempty" validate:"omitempty,max=1000"`
}

// UpdateRatingRequest represents the request body for updating a rating
type UpdateRatingRequest struct {
	Rating int    `json:"rating,omitempty" validate:"omitempty,min=1,max=5"`
	Review string `json:"review,omitempty" validate:"omitempty,max=1000"`
}

// RatingStats represents aggregated rating statistics for an attraction
type RatingStats struct {
	AttractionID  int     `json:"attraction_id"`
	AverageRating float32 `json:"average_rating"`
	TotalRatings  int     `json:"total_ratings"`
	Rating1Count  int     `json:"rating_1_count"`
	Rating2Count  int     `json:"rating_2_count"`
	Rating3Count  int     `json:"rating_3_count"`
	Rating4Count  int     `json:"rating_4_count"`
	Rating5Count  int     `json:"rating_5_count"`
}
