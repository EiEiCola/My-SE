package entity

import (
	"time"

	"gorm.io/gorm"
)

type PostAttachment struct {
	gorm.Model

	PostID     uint   `json:"post_id"`
	FileURL    string `json:"file_url"`
	FileName   string `json:"file_name"`
	FileSize   int64  `json:"file_size"`
	OrderIndex int    `json:"order_index"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
