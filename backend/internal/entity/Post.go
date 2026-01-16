package entity

import (
	"time"

	"gorm.io/gorm"
)

type Post struct {
	gorm.Model
	// FK
	AuthorID uint   `valid:"required~AuthorID is required" json:"author_id"`
	Author   Member `valid:"-" gorm:"foreignKey:AuthorID" json:"author"`

	Title       string `valid:"required~Title is required,stringlength(5|120)~Title must be between 5 and 120 characters" json:"title"`
	Content     string `valid:"required~Content is required,stringlength(1|2000)~Content must be between 1 and 2000 characters" json:"content"`
	IsAnonymous bool   `valid:"-" json:"is_anonymous"`

	// Category (3 ระดับ)
	MainCategoryID  *uint `valid:"-" json:"main_category_id"`
	SubCategoryL1ID *uint `valid:"-" json:"sub_category1_id"`
	SubCategoryL2ID *uint `valid:"-" json:"sub_category2_id"`

	// *** เพิ่มฟิลด์ Back-Reference ตรงนี้ ***
	// (ใช้ชื่อฟิลด์เดียวกับ struct แม่)
	MainCategory  *MainCategory  `valid:"-" gorm:"foreignKey:MainCategoryID" json:"MainCategory,omitempty"`
	SubCategoryL1 *SubCategoryL1 `valid:"-" gorm:"foreignKey:SubCategoryL1ID" json:"SubCategoryL1,omitempty"`
	SubCategoryL2 *SubCategoryL2 `valid:"-" gorm:"foreignKey:SubCategoryL2ID" json:"SubCategoryL2,omitempty"`

	Status        string `valid:"required~Status is required,in(active|reported|deleted)~Status is invalid" json:"status"`
	ViewCount     uint   `json:"view_count"`
	LikeCount     uint   `json:"like_count"`
	CommentCount  uint   `json:"comment_count"`
	DeletedReason string `json:"deleted_reason"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// Relations
	Images      []PostImage      `gorm:"foreignKey:PostID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"images"`
	Attachments []PostAttachment `gorm:"foreignKey:PostID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"attachments"`
	Comments    []Comment        `gorm:"foreignKey:PostID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"comments"`

	Reports []Report `gorm:"polymorphic:Target;" json:"reports"`
}
