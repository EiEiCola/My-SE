package entity

import (
	"time"

	"gorm.io/gorm"
)

type Notification struct {
	gorm.Model
	UserID    uint   `json:"user_id"`
	Title     string `json:"title"`
	Message   string `json:"message"`
	Type      string `json:"type"`       // e.g., "post_deleted", "system", "like", "comment"
	RelatedID uint   `json:"related_id"` // e.g., PostID
	IsRead    bool   `json:"is_read" gorm:"default:false"`
	CreatedAt time.Time
}
