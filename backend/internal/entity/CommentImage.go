package entity

import (
	"time"

	"gorm.io/gorm"
)
type CommentImage struct {
	gorm.Model

	CommentID  uint   `json:"comment_id"`
	URL        string `json:"url"`
	OrderIndex int    `json:"order_index"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}