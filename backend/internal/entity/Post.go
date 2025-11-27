package entity

import (
	"time"

	"gorm.io/gorm"
)

type Post struct {
	gorm.Model 
	// FK
	AuthorID uint `json:"author_id"`

	Title       string `json:"title"`
	Content     string `json:"content"`
	IsAnonymous bool   `json:"is_anonymous"`

	// Category (3 ระดับ)
	MainCategoryID *uint `json:"main_category_id"`
	SubCategory1ID *uint `json:"sub_category1_id"`
	SubCategory2ID *uint `json:"sub_category2_id"`

	Status       string `json:"status"`
	ViewCount    uint   `json:"view_count"`
	LikeCount    uint   `json:"like_count"`
	CommentCount uint   `json:"comment_count"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// Relations
	Images      []PostImage        `gorm:"foreignKey:PostID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"images"`
	Attachments []PostAttachment   `gorm:"foreignKey:PostID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"attachments"`
	Comments    []Comment          `gorm:"foreignKey:PostID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"comments"`
}








