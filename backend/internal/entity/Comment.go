package entity

import (
	"time"

	"gorm.io/gorm"
)

type Comment struct {
	gorm.Model
	// FK
	PostID   uint   `json:"post_id"`
	AuthorID uint   `json:"author_id"`
	Author   Member `gorm:"foreignKey:AuthorID" json:"author"`

	Content     string `json:"content"`
	IsAnonymous bool   `json:"is_anonymous"`
	Status      string `json:"status"`
	LikeCount   uint   `json:"like_count"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// Relations
	Images      []CommentImage      `gorm:"foreignKey:CommentID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"images"`
	Attachments []CommentAttachment `gorm:"foreignKey:CommentID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"attachments"`
}
