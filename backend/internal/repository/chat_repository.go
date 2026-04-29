package repository

import (
	"backend/internal/models"
	"context"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ChatRepository interface {
	CreateSession(ctx context.Context, session *models.ChatSession) error
	GetSession(ctx context.Context, id uuid.UUID) (*models.ChatSession, error)
	UpdateSession(ctx context.Context, session *models.ChatSession) error
	DeleteSession(ctx context.Context, id uuid.UUID) error
	CreateMessage(ctx context.Context, msg *models.ChatMessage) error
	ListRecentMessages(ctx context.Context, sessionID uuid.UUID, limit int) ([]models.ChatMessage, error)
	ListSessionsByUser(ctx context.Context, userID uuid.UUID, limit int) ([]models.ChatSession, error)
}

type chatRepository struct {
	db *gorm.DB
}

func NewChatRepository(db *gorm.DB) ChatRepository {
	return &chatRepository{db: db}
}

func (r *chatRepository) CreateSession(ctx context.Context, session *models.ChatSession) error {
	return r.db.WithContext(ctx).Create(session).Error
}

func (r *chatRepository) GetSession(ctx context.Context, id uuid.UUID) (*models.ChatSession, error) {
	var s models.ChatSession
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(&s).Error; err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *chatRepository) UpdateSession(ctx context.Context, session *models.ChatSession) error {
	return r.db.WithContext(ctx).Save(session).Error
}

func (r *chatRepository) DeleteSession(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("session_id = ?", id).Delete(&models.ChatMessage{}).Error; err != nil {
			return err
		}
		return tx.Delete(&models.ChatSession{}, "id = ?", id).Error
	})
}

func (r *chatRepository) CreateMessage(ctx context.Context, msg *models.ChatMessage) error {
	return r.db.WithContext(ctx).Create(msg).Error
}

func (r *chatRepository) ListRecentMessages(ctx context.Context, sessionID uuid.UUID, limit int) ([]models.ChatMessage, error) {
	if limit <= 0 {
		limit = 20
	}
	var last []models.ChatMessage
	if err := r.db.WithContext(ctx).
		Where("session_id = ?", sessionID).
		Order("created_at DESC").
		Limit(limit).
		Find(&last).Error; err != nil {
		return nil, err
	}
	for i, j := 0, len(last)-1; i < j; i, j = i+1, j-1 {
		last[i], last[j] = last[j], last[i]
	}
	return last, nil
}

func (r *chatRepository) ListSessionsByUser(ctx context.Context, userID uuid.UUID, limit int) ([]models.ChatSession, error) {
	if limit <= 0 {
		limit = 50
	}
	var rows []models.ChatSession
	err := r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("updated_at DESC").
		Limit(limit).
		Find(&rows).Error
	if err != nil {
		return nil, err
	}
	return rows, nil
}
