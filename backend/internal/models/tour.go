package models

import (
	"time"

	"github.com/google/uuid"
)

// TourCompany represents a tour operator company
type TourCompany struct {
	ID          int             `json:"id" gorm:"primaryKey;autoIncrement"`
	Name        LocalizedString `json:"name" gorm:"type:jsonb;not null"`
	Description LocalizedString `json:"description" gorm:"type:jsonb"`
	Logo        string          `json:"logo" gorm:"type:text;not null"`
	Website     *string         `json:"website,omitempty" gorm:"type:text"`
	Phone       string          `json:"phone" gorm:"type:varchar(50);not null"`
	Email       string          `json:"email" gorm:"type:varchar(255);uniqueIndex;not null"`
	City        LocalizedString `json:"city" gorm:"type:jsonb;not null"`
	Address     LocalizedString `json:"address" gorm:"type:jsonb"`
	IsVerified  bool            `json:"is_verified" gorm:"default:false"`
	Rating      float64         `json:"rating" gorm:"type:decimal(3,2);default:0"`
	TotalTours  int             `json:"total_tours" gorm:"default:0"`
	CreatedAt   time.Time       `json:"created_at" gorm:"default:CURRENT_TIMESTAMP"`
	UpdatedAt   time.Time       `json:"updated_at" gorm:"default:CURRENT_TIMESTAMP"`

	Tours []Tour `json:"tours,omitempty" gorm:"foreignKey:CompanyID;references:ID"`
}

func (TourCompany) TableName() string {
	return "tour_companies"
}

// TourDifficulty represents difficulty enum
type TourDifficulty string

const (
	TourDifficultyEasy     TourDifficulty = "easy"
	TourDifficultyModerate TourDifficulty = "moderate"
	TourDifficultyHard     TourDifficulty = "hard"
	TourDifficultyExtreme  TourDifficulty = "extreme"
)

// Tour represents a tour product
type Tour struct {
	ID               int             `json:"id" gorm:"primaryKey;autoIncrement"`
	CompanyID        int             `json:"company_id" gorm:"not null;index"`
	Name             LocalizedString `json:"name" gorm:"type:jsonb;not null"`
	Description      LocalizedString `json:"description" gorm:"type:jsonb"`
	ShortDescription LocalizedString `json:"short_description" gorm:"type:jsonb"`
	Images           ImageArray      `json:"images" gorm:"type:jsonb"`
	DurationDays     int             `json:"duration_days" gorm:"not null;default:0"`
	DurationHours    int             `json:"duration_hours" gorm:"not null;default:0"`
	MaxGroupSize     int             `json:"max_group_size" gorm:"not null;default:0"`
	Price            float64         `json:"price" gorm:"type:decimal(12,2);not null"`
	Currency         string          `json:"currency" gorm:"type:varchar(10);not null;default:'KZT'"`
	Difficulty       TourDifficulty  `json:"difficulty" gorm:"type:varchar(20);not null;default:'easy'"`
	StartCity        LocalizedString `json:"start_city" gorm:"type:jsonb"`
	EndCity          LocalizedString `json:"end_city" gorm:"type:jsonb"`
	IsActive         bool            `json:"is_active" gorm:"default:true"`
	AverageRating    float64         `json:"average_rating" gorm:"type:decimal(3,2);default:0"`
	TotalBookings    int             `json:"total_bookings" gorm:"default:0"`
	CreatedAt        time.Time       `json:"created_at" gorm:"default:CURRENT_TIMESTAMP"`
	UpdatedAt        time.Time       `json:"updated_at" gorm:"default:CURRENT_TIMESTAMP"`

	Company     *TourCompany        `json:"company,omitempty" gorm:"foreignKey:CompanyID;references:ID"`
	Attractions []Attraction        `json:"attractions,omitempty" gorm:"many2many:tour_attractions;"`
	Schedules   []TourSchedule      `json:"schedules,omitempty" gorm:"foreignKey:TourID;references:ID"`
}

func (Tour) TableName() string {
	return "tours"
}

// TourAttraction represents junction table between tours and attractions with order
type TourAttraction struct {
	TourID       int `json:"tour_id" gorm:"primaryKey"`
	AttractionID int `json:"attraction_id" gorm:"primaryKey"`
	Order        int `json:"order" gorm:"not null;default:0"`
}

func (TourAttraction) TableName() string {
	return "tour_attractions"
}

// TourSchedule represents concrete schedule/departure for a tour
type TourSchedule struct {
	ID             int       `json:"id" gorm:"primaryKey;autoIncrement"`
	TourID         int       `json:"tour_id" gorm:"not null;index"`
	StartDate      time.Time `json:"start_date" gorm:"type:date;not null"`
	EndDate        time.Time `json:"end_date" gorm:"type:date;not null"`
	AvailableSpots int       `json:"available_spots" gorm:"not null"`
	Status         string    `json:"status" gorm:"type:varchar(20);not null;default:'scheduled'"` // scheduled, full, cancelled, completed
	CreatedAt      time.Time `json:"created_at" gorm:"default:CURRENT_TIMESTAMP"`
	UpdatedAt      time.Time `json:"updated_at" gorm:"default:CURRENT_TIMESTAMP"`

	Tour *Tour `json:"tour,omitempty" gorm:"foreignKey:TourID;references:ID"`
}

func (TourSchedule) TableName() string {
	return "tour_schedules"
}

// BookingStatus represents booking status enum
type BookingStatus string

const (
	BookingStatusPending   BookingStatus = "pending"
	BookingStatusConfirmed BookingStatus = "confirmed"
	BookingStatusCancelled BookingStatus = "cancelled"
	BookingStatusCompleted BookingStatus = "completed"
)

// Booking represents a user's booking for a tour schedule
type Booking struct {
	ID             uuid.UUID     `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID         uuid.UUID     `json:"user_id" gorm:"type:uuid;not null;index"`
	TourID         int           `json:"tour_id" gorm:"not null;index"`
	ScheduleID     int           `json:"schedule_id" gorm:"not null;index"`
	CompanyID      int           `json:"company_id" gorm:"not null;index"`
	NumberOfPeople int           `json:"number_of_people" gorm:"not null"`
	TotalPrice     float64       `json:"total_price" gorm:"type:decimal(12,2);not null"`
	Status         BookingStatus `json:"status" gorm:"type:varchar(20);not null;default:'pending'"`
	ContactPhone   string        `json:"contact_phone" gorm:"type:varchar(50);not null"`
	ContactEmail   string        `json:"contact_email" gorm:"type:varchar(255);not null"`
	Notes          *string       `json:"notes,omitempty" gorm:"type:text"`
	PaypalOrderID  *string       `json:"paypal_order_id,omitempty" gorm:"type:varchar(32);index"`
	PaypalCaptureID *string      `json:"paypal_capture_id,omitempty" gorm:"type:varchar(64)"`
	PolarCheckoutID *string     `json:"polar_checkout_id,omitempty" gorm:"type:varchar(64);index"`
	PolarOrderID   *string       `json:"polar_order_id,omitempty" gorm:"type:varchar(64);index"`
	CreatedAt      time.Time     `json:"created_at" gorm:"default:CURRENT_TIMESTAMP"`
	UpdatedAt      time.Time     `json:"updated_at" gorm:"default:CURRENT_TIMESTAMP"`

	User     *User         `json:"user,omitempty" gorm:"foreignKey:UserID;references:ID"`
	Tour     *Tour         `json:"tour,omitempty" gorm:"foreignKey:TourID;references:ID"`
	Schedule *TourSchedule `json:"schedule,omitempty" gorm:"foreignKey:ScheduleID;references:ID"`
	Company  *TourCompany  `json:"company,omitempty" gorm:"foreignKey:CompanyID;references:ID"`
}

func (Booking) TableName() string {
	return "bookings"
}

// CreateTourCompanyRequest represents payload for creating a company
type CreateTourCompanyRequest struct {
	Name        LocalizedString `json:"name" validate:"required"`
	Description LocalizedString `json:"description"`
	Logo        string          `json:"logo" validate:"required"`
	Website     *string         `json:"website,omitempty"`
	Phone       string          `json:"phone" validate:"required"`
	Email       string          `json:"email" validate:"required,email"`
	City        LocalizedString `json:"city" validate:"required"`
	Address     LocalizedString `json:"address"`
}

// UpdateTourCompanyRequest represents payload for updating a company
type UpdateTourCompanyRequest struct {
	Name        LocalizedString `json:"name,omitempty"`
	Description LocalizedString `json:"description,omitempty"`
	Logo        *string         `json:"logo,omitempty"`
	Website     *string         `json:"website,omitempty"`
	Phone       *string         `json:"phone,omitempty"`
	Email       *string         `json:"email,omitempty" validate:"omitempty,email"`
	City        LocalizedString `json:"city,omitempty"`
	Address     LocalizedString `json:"address,omitempty"`
	IsVerified  *bool           `json:"is_verified,omitempty"`
}

// TourFilter represents filters for listing tours
type TourFilter struct {
	City      *string         `json:"city,omitempty"`
	CompanyID *int            `json:"company_id,omitempty"`
	MinPrice  *float64        `json:"min_price,omitempty"`
	MaxPrice  *float64        `json:"max_price,omitempty"`
	Duration  *int            `json:"duration,omitempty"`
	Difficulty *TourDifficulty `json:"difficulty,omitempty"`
}

// CreateTourRequest represents payload for creating a tour
type CreateTourRequest struct {
	CompanyID        int             `json:"company_id" validate:"required"`
	Name             LocalizedString `json:"name" validate:"required"`
	Description      LocalizedString `json:"description"`
	ShortDescription LocalizedString `json:"short_description"`
	Images           []ImageSizes    `json:"images,omitempty"`
	DurationDays     int             `json:"duration_days"`
	DurationHours    int             `json:"duration_hours"`
	MaxGroupSize     int             `json:"max_group_size"`
	Price            float64         `json:"price" validate:"required"`
	Currency         string          `json:"currency"`
	Difficulty       TourDifficulty  `json:"difficulty"`
	StartCity        LocalizedString `json:"start_city"`
	EndCity          LocalizedString `json:"end_city"`
	IsActive         *bool           `json:"is_active,omitempty"`
	AttractionIDs    []int           `json:"attraction_ids,omitempty"`
}

// UpdateTourRequest represents payload for updating a tour
type UpdateTourRequest struct {
	CompanyID        *int            `json:"company_id,omitempty"`
	Name             LocalizedString `json:"name,omitempty"`
	Description      LocalizedString `json:"description,omitempty"`
	ShortDescription LocalizedString `json:"short_description,omitempty"`
	Images           []ImageSizes    `json:"images,omitempty"`
	DurationDays     *int            `json:"duration_days,omitempty"`
	DurationHours    *int            `json:"duration_hours,omitempty"`
	MaxGroupSize     *int            `json:"max_group_size,omitempty"`
	Price            *float64        `json:"price,omitempty"`
	Currency         *string         `json:"currency,omitempty"`
	Difficulty       *TourDifficulty `json:"difficulty,omitempty"`
	StartCity        LocalizedString `json:"start_city,omitempty"`
	EndCity          LocalizedString `json:"end_city,omitempty"`
	IsActive         *bool           `json:"is_active,omitempty"`
	AttractionIDs    []int           `json:"attraction_ids,omitempty"`
}

// CreateBookingRequest represents payload for creating a booking
type CreateBookingRequest struct {
	TourID         int    `json:"tour_id" validate:"required"`
	ScheduleID     int    `json:"schedule_id" validate:"required"`
	NumberOfPeople int    `json:"number_of_people" validate:"required,min=1"`
	ContactPhone   string `json:"contact_phone" validate:"required"`
	ContactEmail   string `json:"contact_email" validate:"required,email"`
	Notes          string `json:"notes,omitempty"`
}

