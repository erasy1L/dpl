package repository

import (
	"backend/internal/models"
	"context"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserPreferencesRepository interface {
	GetPreferences(ctx context.Context, userID uuid.UUID) (*models.UserPreferences, error)
	CreateOrUpdatePreferences(ctx context.Context, prefs *models.UserPreferences) error
	DeletePreferences(ctx context.Context, userID uuid.UUID) error
}

type userPreferencesRepository struct {
	db *gorm.DB
}

func NewUserPreferencesRepository(db *gorm.DB) UserPreferencesRepository {
	return &userPreferencesRepository{db: db}
}

// GetPreferences - get user preferences
func (r *userPreferencesRepository) GetPreferences(ctx context.Context, userID uuid.UUID) (*models.UserPreferences, error) {
	var prefs models.UserPreferences
	err := r.db.WithContext(ctx).Where("user_id = ?", userID).First(&prefs).Error
	if err != nil {
		return nil, err
	}
	return &prefs, nil
}

// CreateOrUpdatePreferences - upsert preferences
func (r *userPreferencesRepository) CreateOrUpdatePreferences(ctx context.Context, prefs *models.UserPreferences) error {
	return r.db.WithContext(ctx).
		Where("user_id = ?", prefs.UserID).
		Assign(prefs).
		FirstOrCreate(prefs).Error
}

// DeletePreferences - delete preferences
func (r *userPreferencesRepository) DeletePreferences(ctx context.Context, userID uuid.UUID) error {
	return r.db.WithContext(ctx).Where("user_id = ?", userID).Delete(&models.UserPreferences{}).Error
}
