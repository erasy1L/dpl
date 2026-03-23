package auth

import (
	"backend/internal/models"
	"backend/internal/repository"
	"backend/pkg/utils"
	"context"
	"errors"
	"fmt"
	"os"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrInvalidCredentials = errors.New("invalid email or password")
	ErrUserNotFound       = errors.New("user not found")
	ErrEmailAlreadyExists = errors.New("email already exists")
	ErrEmailNotVerified   = errors.New("email is not verified")
	ErrInvalidToken       = errors.New("invalid token")
	ErrInvalidCurrentPassword = errors.New("invalid current password")
)

const tokenTTL = 24 * time.Hour

type AuthService interface {
	SignUp(ctx context.Context, email, password, name string) (*models.User, error)
	SignIn(ctx context.Context, email, password string) (*models.User, error)
	VerifyEmail(ctx context.Context, token string) error
	ResendVerification(ctx context.Context, email string) error
	ForgotPassword(ctx context.Context, email string) error
	ResetPassword(ctx context.Context, token, newPassword string) error
	ChangePassword(ctx context.Context, userID uuid.UUID, currentPassword, newPassword string) error
	ValidatePassword(hashedPassword, password string) error
}

type authService struct {
	userRepo repository.UserRepository
}

func NewAuthService(userRepo repository.UserRepository) AuthService {
	return &authService{
		userRepo: userRepo,
	}
}

func (s *authService) SignUp(ctx context.Context, email, password, name string) (*models.User, error) {
	// Check if user already exists
	existingUser, err := s.userRepo.GetByEmail(ctx, email)
	if err == nil && existingUser != nil {
		return nil, ErrEmailAlreadyExists
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// Bootstrap: если администраторов ещё нет — первая регистрация станет `admin`.
	adminCount, err := s.userRepo.CountByRole(ctx, models.RoleAdmin)
	if err != nil {
		return nil, err
	}

	role := models.RoleUser
	if adminCount == 0 {
		role = models.RoleAdmin
	}

	verifyToken, err := utils.GenerateSecureToken(32)
	if err != nil {
		return nil, err
	}
	now := time.Now()

	// Create user
	user := &models.User{
		ID:        uuid.New(),
		Email:     email,
		Name:      name,
		Role:      role,
		EmailVerified:          false,
		EmailVerificationToken: &verifyToken,
		EmailVerificationSent:  &now,
		Password:  string(hashedPassword),
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, err
	}

	_ = s.sendVerificationEmail(user.Email, verifyToken)

	// Clear password before returning
	user.Password = ""
	return user, nil
}

func (s *authService) SignIn(ctx context.Context, email, password string) (*models.User, error) {
	// Get user by email
	user, err := s.userRepo.GetByEmail(ctx, email)
	if err != nil {
		return nil, ErrInvalidCredentials
	}

	// Validate password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return nil, ErrInvalidCredentials
	}

	if !user.EmailVerified {
		return nil, ErrEmailNotVerified
	}

	// Clear password before returning
	user.Password = ""
	return user, nil
}

func (s *authService) ValidatePassword(hashedPassword, password string) error {
	return bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
}

func (s *authService) VerifyEmail(ctx context.Context, token string) error {
	user, err := s.userRepo.GetByEmailVerificationToken(ctx, token)
	if err != nil || user == nil {
		return ErrInvalidToken
	}

	if user.EmailVerificationSent == nil || time.Since(*user.EmailVerificationSent) > tokenTTL {
		return ErrInvalidToken
	}

	user.EmailVerified = true
	user.EmailVerificationToken = nil
	user.EmailVerificationSent = nil
	return s.userRepo.Update(ctx, user)
}

func (s *authService) ResendVerification(ctx context.Context, email string) error {
	user, err := s.userRepo.GetByEmail(ctx, email)
	if err != nil || user == nil {
		// don't leak existence
		return nil
	}

	if user.EmailVerified {
		return nil
	}

	token, err := utils.GenerateSecureToken(32)
	if err != nil {
		return err
	}
	now := time.Now()
	user.EmailVerificationToken = &token
	user.EmailVerificationSent = &now
	if err := s.userRepo.Update(ctx, user); err != nil {
		return err
	}

	return s.sendVerificationEmail(user.Email, token)
}

func (s *authService) ForgotPassword(ctx context.Context, email string) error {
	user, err := s.userRepo.GetByEmail(ctx, email)
	if err != nil || user == nil {
		// do not reveal existence
		return nil
	}

	token, err := utils.GenerateSecureToken(32)
	if err != nil {
		return err
	}
	now := time.Now()
	user.ResetPasswordToken = &token
	user.ResetPasswordSent = &now
	if err := s.userRepo.Update(ctx, user); err != nil {
		return err
	}

	return s.sendResetEmail(user.Email, token)
}

func (s *authService) ResetPassword(ctx context.Context, token, newPassword string) error {
	user, err := s.userRepo.GetByResetPasswordToken(ctx, token)
	if err != nil || user == nil {
		return ErrInvalidToken
	}

	// Token lifetime: 24 hours.
	if user.ResetPasswordSent == nil || time.Since(*user.ResetPasswordSent) > tokenTTL {
		return ErrInvalidToken
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	user.Password = string(hashedPassword)
	user.ResetPasswordToken = nil
	user.ResetPasswordSent = nil
	return s.userRepo.Update(ctx, user)
}

func (s *authService) ChangePassword(ctx context.Context, userID uuid.UUID, currentPassword, newPassword string) error {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil || user == nil {
		return ErrUserNotFound
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(currentPassword)); err != nil {
		return ErrInvalidCurrentPassword
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	user.Password = string(hashedPassword)
	return s.userRepo.Update(ctx, user)
}

func (s *authService) sendVerificationEmail(email, token string) error {
	baseURL := os.Getenv("APP_BASE_URL")
	if baseURL == "" {
		baseURL = "http://localhost:5173"
	}
	link := fmt.Sprintf("%s/verify-email?token=%s", baseURL, token)
	subject := "Verify your email"
	body := fmt.Sprintf("Please verify your email by opening this link:\n%s", link)
	return utils.SendEmail(email, subject, body)
}

func (s *authService) sendResetEmail(email, token string) error {
	baseURL := os.Getenv("APP_BASE_URL")
	if baseURL == "" {
		baseURL = "http://localhost:5173"
	}
	link := fmt.Sprintf("%s/reset-password?token=%s", baseURL, token)
	subject := "Reset your password"
	body := fmt.Sprintf("Use this link to reset your password:\n%s\n\nThis link expires in 24 hours.", link)
	return utils.SendEmail(email, subject, body)
}
