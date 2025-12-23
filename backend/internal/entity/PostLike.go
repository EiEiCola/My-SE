package entity

import (
	"time"

	"gorm.io/gorm"
)

// PostLike tracks which users liked which posts
// Each user can only like a post once (unique constraint on PostID + UserID)
type PostLike struct {
	gorm.Model
	PostID uint `json:"post_id" gorm:"index;not null"`
	UserID uint `json:"user_id" gorm:"index;not null"`

	CreatedAt time.Time `json:"created_at"`

	// Unique constraint to prevent duplicate likes
	// One user can only like a post once
}

// TableName sets the table name
func (PostLike) TableName() string {
	return "post_likes"
}
