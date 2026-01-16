package entity

import (
	"time"

	"gorm.io/gorm"
)
type PostImage struct {
	gorm.Model

	PostID     uint   `json:"post_id"`
	URL        string `json:"url"`
	OrderIndex int    `json:"order_index"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}