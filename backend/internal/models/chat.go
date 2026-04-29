package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
)

// ChatSession groups a conversation
type ChatSession struct {
	ID        uuid.UUID  `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID    *uuid.UUID `json:"user_id,omitempty" gorm:"type:uuid;index"`
	Title     string     `json:"title" gorm:"type:varchar(255);not null;default:''"`
	CreatedAt time.Time  `json:"created_at" gorm:"default:CURRENT_TIMESTAMP"`
	UpdatedAt time.Time  `json:"updated_at" gorm:"default:CURRENT_TIMESTAMP"`
}

func (ChatSession) TableName() string {
	return "chat_sessions"
}

// ChatMessage is one turn in a chat
type ChatMessage struct {
	ID        uuid.UUID      `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	SessionID uuid.UUID      `json:"session_id" gorm:"type:uuid;not null;index"`
	UserID    *uuid.UUID     `json:"user_id,omitempty" gorm:"type:uuid;index"`
	Role      string         `json:"role" gorm:"type:varchar(20);not null"` // user | assistant
	Content   string         `json:"content" gorm:"type:text;not null"`
	Metadata  datatypes.JSON `json:"metadata,omitempty" gorm:"type:jsonb"`
	CreatedAt time.Time      `json:"created_at" gorm:"default:CURRENT_TIMESTAMP"`
}

func (ChatMessage) TableName() string {
	return "chat_messages"
}

// ChatMessageMetadata is stored in ChatMessage.Metadata JSONB
type ChatMessageMetadata struct {
	ReferencedAttractions []int  `json:"referenced_attractions,omitempty"`
	ReferencedTours       []int  `json:"referenced_tours,omitempty"`
	SuggestedAction       string `json:"suggested_action,omitempty"`
}
