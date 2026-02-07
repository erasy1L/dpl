package models

import "time"

// Category represents a category of attractions
type Category struct {
	ID        int       `json:"id" gorm:"primaryKey;autoIncrement"`
	NameEn    string    `json:"name_en" gorm:"column:name_en;type:varchar;not null" validate:"required,min=2,max=50"`
	NameRu    string    `json:"name_ru" gorm:"column:name_ru;type:varchar" validate:"omitempty,min=2,max=50"`
	Icon      string    `json:"icon" gorm:"type:varchar;not null" validate:"required"`
	CreatedAt time.Time `json:"created_at" gorm:"default:CURRENT_TIMESTAMP"`
	UpdatedAt time.Time `json:"updated_at" gorm:"default:CURRENT_TIMESTAMP"`
}

// TableName specifies the table name for Category model
func (Category) TableName() string {
	return "categories"
}

// CreateCategoryRequest represents the request body for creating a new category
type CreateCategoryRequest struct {
	NameEn string `json:"name_en" validate:"required,min=2,max=50"`
	NameRu string `json:"name_ru,omitempty" validate:"omitempty,min=2,max=50"`
	Icon   string `json:"icon" validate:"required"`
}

// UpdateCategoryRequest represents the request body for updating a category
type UpdateCategoryRequest struct {
	NameEn string `json:"name_en,omitempty" validate:"omitempty,min=2,max=50"`
	NameRu string `json:"name_ru,omitempty" validate:"omitempty,min=2,max=50"`
	Icon   string `json:"icon,omitempty"`
}
