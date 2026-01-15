package entity

import (
	"time"

	"gorm.io/gorm"
)

type Comment struct {
	gorm.Model
	// FK
	PostID   uint   `valid:"required~PostID is required" json:"post_id"`
	AuthorID uint   `valid:"required~AuthorID is required" json:"author_id"`
	Author   Member `valid:"-" gorm:"foreignKey:AuthorID" json:"author"`

	Content     string `valid:"required~Content is required,stringlength(1|1000)~Content must be between 1 and 1000 characters" json:"content"`
	IsAnonymous bool   `valid:"-" json:"is_anonymous"`
	Status      string `valid:"-" json:"status"`
	LikeCount   uint   `valid:"-" json:"like_count"`

	CreatedAt time.Time `valid:"-" json:"created_at"`
	UpdatedAt time.Time `valid:"-" json:"updated_at"`

	// Relations
	Images      []CommentImage      `gorm:"foreignKey:CommentID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"images"`
	Attachments []CommentAttachment `gorm:"foreignKey:CommentID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"attachments"`
}
