package user

import (
	"backend/internal/models"
	"backend/internal/repository"
	"context"
	"errors"

	"github.com/google/uuid"
)

var (
	ErrUserNotFound = errors.New("user not found")
)

type UserService interface {
	GetByID(ctx context.Context, id uuid.UUID) (*models.User, error)
	GetByEmail(ctx context.Context, email string) (*models.User, error)
	Update(ctx context.Context, user *models.User) error
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context, limit, offset int) ([]models.User, error)
	Count(ctx context.Context) (int64, error)
	GetUserProfile(ctx context.Context, userID uuid.UUID) (*models.UserProfileResponse, error)
}

type userService struct {
	userRepo repository.UserRepository
	txMgr    repository.TransactionManager
}

func NewUserService(userRepo repository.UserRepository, txMgr repository.TransactionManager) UserService {
	return &userService{
		userRepo: userRepo,
		txMgr:    txMgr,
	}
}

func (s *userService) GetByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	user, err := s.userRepo.GetByID(ctx, id)
	if err != nil {
		return nil, ErrUserNotFound
	}
	// Clear password before returning
	user.Password = ""
	return user, nil
}

func (s *userService) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	user, err := s.userRepo.GetByEmail(ctx, email)
	if err != nil {
		return nil, ErrUserNotFound
	}
	// Clear password before returning
	user.Password = ""
	return user, nil
}

func (s *userService) Update(ctx context.Context, user *models.User) error {
	return s.txMgr.WithTransaction(ctx, func(txCtx context.Context) error {
		return s.userRepo.Update(txCtx, user)
	})
}

func (s *userService) Delete(ctx context.Context, id uuid.UUID) error {
	return s.txMgr.WithTransaction(ctx, func(txCtx context.Context) error {
		return s.userRepo.Delete(txCtx, id)
	})
}

func (s *userService) List(ctx context.Context, limit, offset int) ([]models.User, error) {
	users, err := s.userRepo.List(ctx, limit, offset)
	if err != nil {
		return nil, err
	}
	// Clear passwords before returning
	for i := range users {
		users[i].Password = ""
	}
	return users, nil
}

func (s *userService) Count(ctx context.Context) (int64, error) {
	return s.userRepo.Count(ctx)
}

func (s *userService) GetUserProfile(ctx context.Context, userID uuid.UUID) (*models.UserProfileResponse, error) {
	// Get user basic info
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, ErrUserNotFound
	}

	// Get user stats
	stats, err := s.userRepo.GetUserStats(ctx, userID)
	if err != nil {
		return nil, err
	}

	// Build profile response
	profile := &models.UserProfileResponse{
		ID:          user.ID,
		Email:       user.Email,
		Name:        user.Name,
		MemberSince: user.CreatedAt.Format("2006-01-02"),
		Stats:       *stats,
	}

	return profile, nil
}
