package entity

import (
	"time"

	"gorm.io/gorm"
)
type CommentAttachment struct {
	gorm.Model

	CommentID  uint   `json:"comment_id"`
	FileURL    string `json:"file_url"`
	FileName   string `json:"file_name"`
	FileSize   int64  `json:"file_size"`
	OrderIndex int    `json:"order_index"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}