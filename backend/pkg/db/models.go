package db

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Email     string    `gorm:"type:varchar;unique"`
	Name      string    `gorm:"type:varchar;not null"`
	Password  string    `gorm:"type:varchar;not null"`
	CreatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP"`
	UpdatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP"`
}

func (User) TableName() string {
	return "users"
}

type Category struct {
	ID        int       `gorm:"primaryKey;autoIncrement"`
	Name      string    `gorm:"type:varchar;not null;unique"`
	Icon      string    `gorm:"type:varchar;not null"`
	CreatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP"`
	UpdatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP"`
}

func (Category) TableName() string {
	return "categories"
}

type Attraction struct {
	ID          int       `gorm:"primaryKey;autoIncrement"`
	CategoryID  int       `gorm:"not null;index"`
	NameEn      string    `gorm:"column:name_en;type:varchar;not null"`
	NameKz      string    `gorm:"column:name_kz;type:varchar;not null"`
	NameRu      string    `gorm:"column:name_ru;type:varchar;not null"`
	Description string    `gorm:"type:text"`
	City        string    `gorm:"type:varchar(50);not null;index"`
	Popularity  float32   `gorm:"type:real;not null;default:0;index"`
	CreatedAt   time.Time `gorm:"default:CURRENT_TIMESTAMP"`
	UpdatedAt   time.Time `gorm:"default:CURRENT_TIMESTAMP"`

	Category Category `gorm:"foreignKey:CategoryID;references:ID"`
}

func (Attraction) TableName() string {
	return "attractions"
}

type UserPreferences struct {
	ID               uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID           uuid.UUID `gorm:"type:uuid;not null"`
	CategoryID       uuid.UUID `gorm:"type:uuid;not null"`
	PreferenceWeight float32   `gorm:"type:real;not null"`
	CreatedAt        time.Time `gorm:"default:CURRENT_TIMESTAMP"`
}

func (UserPreferences) TableName() string {
	return "user_preferences"
}
