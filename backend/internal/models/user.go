package models

import (
	"time"

	"github.com/google/uuid"
)

// UserRole defines user permissions scope.
type UserRole string

const (
	RoleUser    UserRole = "user"
	RoleManager UserRole = "manager"
	RoleAdmin   UserRole = "admin"
)

// User represents a user in the system
type User struct {
	ID                     uuid.UUID  `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	Email                  string     `json:"email" gorm:"type:varchar;unique;not null" validate:"required,email"`
	Name                   string     `json:"name" gorm:"type:varchar;not null" validate:"required,min=2,max=100"`
	Role                   UserRole   `json:"role" gorm:"type:varchar(20);not null;default:'user'" validate:"oneof=user manager admin"`
	EmailVerified          bool       `json:"email_verified" gorm:"not null;default:false"`
	EmailVerificationToken *string    `json:"-" gorm:"column:email_verification_token"`
	EmailVerificationSent  *time.Time `json:"-" gorm:"column:email_verification_sent_at"`
	ResetPasswordToken     *string    `json:"-" gorm:"column:reset_password_token"`
	ResetPasswordSent      *time.Time `json:"-" gorm:"column:reset_password_sent_at"`
	Password               string     `json:"-" gorm:"type:varchar;not null"`
	CreatedAt              time.Time  `json:"created_at" gorm:"default:CURRENT_TIMESTAMP"`
	UpdatedAt              time.Time  `json:"updated_at" gorm:"default:CURRENT_TIMESTAMP"`
}

// TableName specifies the table name for User model
func (User) TableName() string {
	return "users"
}

// CreateUserRequest represents the request body for creating a new user
type CreateUserRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Name     string `json:"name" validate:"required,min=2,max=100"`
	Password string `json:"password" validate:"required,min=6"`
}

// UpdateUserRequest represents the request body for updating a user
type UpdateUserRequest struct {
	Email string `json:"email,omitempty" validate:"omitempty,email"`
	Name  string `json:"name,omitempty" validate:"omitempty,min=2,max=100"`
}

// UserResponse represents the response body for user data (without sensitive info)
type UserResponse struct {
	ID            uuid.UUID `json:"id"`
	Email         string    `json:"email"`
	Name          string    `json:"name"`
	Role          UserRole  `json:"role"`
	EmailVerified bool      `json:"email_verified"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// ToResponse converts User to UserResponse
func (u *User) ToResponse() UserResponse {
	return UserResponse{
		ID:        u.ID,
		Email:     u.Email,
		Name:      u.Name,
		Role:      u.Role,
		EmailVerified: u.EmailVerified,
		CreatedAt: u.CreatedAt,
		UpdatedAt: u.UpdatedAt,
	}
}

// LoginRequest represents the request body for user login
type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

// LoginResponse represents the response body for successful login
type LoginResponse struct {
	Token string       `json:"token"`
	User  UserResponse `json:"user"`
}

// UserStats represents user statistics
type UserStats struct {
	AttractionsVisited int     `json:"attractions_visited"`
	ReviewsWritten     int     `json:"reviews_written"`
	AverageRating      float64 `json:"average_rating"`
}

// UserProfileResponse represents the full user profile with stats
type UserProfileResponse struct {
	ID          uuid.UUID `json:"id"`
	Email       string    `json:"email"`
	Name        string    `json:"name"`
	MemberSince string    `json:"member_since"`
	Stats       UserStats `json:"stats"`
}
