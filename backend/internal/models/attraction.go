package models

import (
	"database/sql/driver"
	"encoding/json"
	"time"

	"github.com/pgvector/pgvector-go"
)

// LocalizedString represents a JSONB field with locale keys and translated values
type LocalizedString map[string]string

// Scan implements the sql.Scanner interface for LocalizedString
func (ls *LocalizedString) Scan(value interface{}) error {
	if value == nil {
		*ls = make(LocalizedString)
		return nil
	}

	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}

	return json.Unmarshal(bytes, ls)
}

// Value implements the driver.Valuer interface for LocalizedString
func (ls LocalizedString) Value() (driver.Value, error) {
	if ls == nil {
		return json.Marshal(map[string]string{})
	}
	return json.Marshal(ls)
}

// ImageSizes represents different sizes of an image
type ImageSizes struct {
	Thumbnail string `json:"thumbnail,omitempty"`
	Small     string `json:"small,omitempty"`
	Medium    string `json:"medium,omitempty"`
	Large     string `json:"large,omitempty"`
	Original  string `json:"original,omitempty"`
}

// ImageArray represents a JSONB array of images with different sizes
type ImageArray []ImageSizes

// Scan implements the sql.Scanner interface for ImageArray
func (ia *ImageArray) Scan(value interface{}) error {
	if value == nil {
		*ia = []ImageSizes{}
		return nil
	}

	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}

	return json.Unmarshal(bytes, ia)
}

// Value implements the driver.Valuer interface for ImageArray
func (ia ImageArray) Value() (driver.Value, error) {
	if ia == nil {
		return json.Marshal([]ImageSizes{})
	}
	return json.Marshal(ia)
}

// ReviewRatingCount represents the JSONB field for rating distribution
type ReviewRatingCount map[string]int

// Scan implements the sql.Scanner interface for ReviewRatingCount
func (rrc *ReviewRatingCount) Scan(value interface{}) error {
	if value == nil {
		*rrc = make(ReviewRatingCount)
		return nil
	}

	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}

	return json.Unmarshal(bytes, rrc)
}

// Value implements the driver.Valuer interface for ReviewRatingCount
func (rrc ReviewRatingCount) Value() (driver.Value, error) {
	if rrc == nil {
		return json.Marshal(map[string]int{})
	}
	return json.Marshal(rrc)
}

// AttractionCategory represents the junction table between attractions and categories
type AttractionCategory struct {
	AttractionID int `json:"attraction_id" gorm:"primaryKey"`
	CategoryID   int `json:"category_id" gorm:"primaryKey"`
}

// TableName specifies the table name for AttractionCategory model
func (AttractionCategory) TableName() string {
	return "attraction_categories"
}

// Attraction represents a tourist attraction
type Attraction struct {
	ID                int               `json:"id" gorm:"primaryKey;autoIncrement"`
	Name              LocalizedString   `json:"name" gorm:"type:jsonb;not null"`
	Description       LocalizedString   `json:"description" gorm:"type:jsonb"`
	City              LocalizedString   `json:"city" gorm:"type:jsonb;not null"`
	Address           LocalizedString   `json:"address" gorm:"type:jsonb"`
	Country           LocalizedString   `json:"country" gorm:"type:jsonb"`
	Latitude          *float64          `json:"latitude,omitempty" gorm:"type:double precision"`
	Longitude         *float64          `json:"longitude,omitempty" gorm:"type:double precision"`
	Images            ImageArray        `json:"images" gorm:"type:jsonb"`
	AverageRating     *float64          `json:"average_rating,omitempty" gorm:"type:decimal(3,2);default:0"`
	TotalRatings      *int              `json:"total_ratings,omitempty" gorm:"default:0"`
	TotalViews        *int              `json:"total_views,omitempty" gorm:"default:0"`
	ReviewRatingCount ReviewRatingCount `json:"review_rating_count" gorm:"type:jsonb"`
	Embedding         pgvector.Vector   `json:"-" gorm:"type:vector(384)"`
	CreatedAt         time.Time         `json:"created_at" gorm:"default:CURRENT_TIMESTAMP"`
	UpdatedAt         time.Time         `json:"updated_at" gorm:"default:CURRENT_TIMESTAMP"`

	// Many-to-many relationship with categories
	Categories []Category `json:"categories,omitempty" gorm:"many2many:attraction_categories;"`
}

// TableName specifies the table name for Attraction model
func (Attraction) TableName() string {
	return "attractions"
}

// CreateAttractionRequest represents the request body for creating a new attraction
type CreateAttractionRequest struct {
	Name        LocalizedString `json:"name" validate:"required"`
	Description LocalizedString `json:"description"`
	City        LocalizedString `json:"city" validate:"required"`
	Address     LocalizedString `json:"address"`
	Country     LocalizedString `json:"country"`
	Latitude    *float64        `json:"latitude,omitempty"`
	Longitude   *float64        `json:"longitude,omitempty"`
	Images      []ImageSizes    `json:"images,omitempty"`
	CategoryIDs []int           `json:"category_ids,omitempty"`
}

// UpdateAttractionRequest represents the request body for updating an attraction
type UpdateAttractionRequest struct {
	Name        LocalizedString `json:"name,omitempty"`
	Description LocalizedString `json:"description,omitempty"`
	City        LocalizedString `json:"city,omitempty"`
	Address     LocalizedString `json:"address,omitempty"`
	Country     LocalizedString `json:"country,omitempty"`
	Latitude    *float64        `json:"latitude,omitempty"`
	Longitude   *float64        `json:"longitude,omitempty"`
	Images      []ImageSizes    `json:"images,omitempty"`
	CategoryIDs []int           `json:"category_ids,omitempty"`
}

// AttractionWithDistance represents an attraction with calculated distance
type AttractionWithDistance struct {
	Attraction
	Distance float64 `json:"distance,omitempty"` // Distance in kilometers
}

// AttractionSearchParams represents search parameters for attractions
type AttractionSearchParams struct {
	Query       string   `json:"query,omitempty"`
	City        string   `json:"city,omitempty"`
	CategoryIDs []int    `json:"category_ids,omitempty"`
	MinRating   *float32 `json:"min_rating,omitempty"`
	Latitude    *float64 `json:"latitude,omitempty"`
	Longitude   *float64 `json:"longitude,omitempty"`
	MaxDistance *float64 `json:"max_distance,omitempty"` // in kilometers
	Limit       int      `json:"limit,omitempty"`
	Offset      int      `json:"offset,omitempty"`
}
