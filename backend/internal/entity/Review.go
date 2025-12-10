package entity

import (
	"gorm.io/gorm"
	"time"
)
type Review struct {
	gorm.Model
	Title           string    `json:"title"`
	Content         string    `json:"content"`
	Rating          int       `json:"rating"`
	IsAnonymous     bool      `json:"is_anonymous"`
	HelpfulCount    int       `json:"helpful_count"`
	NotHelpfulCount int       `json:"not_helpful_count"`
	CreatedAt       time.Time `json:"created_at"`

	MemberID   uint   `json:"member_id"`  
    Member     Member `gorm:"foreignKey:MemberID;references:ID"`

	//FK category
	MainCategoryID *uint         `json:"main_category_id"`
	MainCategory   MainCategory `gorm:"foreignKey:MainCategoryID;references:ID"`

	SubCategoryL1ID *uint          `json:"sub_category_l1_id"`
	SubCategoryL1   SubCategoryL1 `gorm:"foreignKey:SubCategoryL1ID;references:ID"`

	SubCategoryL2ID *uint          `json:"sub_category_l2_id"`
	SubCategoryL2   SubCategoryL2 `gorm:"foreignKey:SubCategoryL2ID;references:ID"`

	ReviewImages []ReviewImage `gorm:"foreignKey:ReviewID;references:ID"`
	ReviewVotes  []ReviewVote  `gorm:"foreignKey:ReviewID;references:ID"`
	Tags        []Tag        `gorm:"many2many:review_tags" json:"tags"`
    ReviewTags  []ReviewTag  `gorm:"foreignKey:ReviewID"`

	Reports []Report `gorm:"polymorphic:Target;" json:"reports"`
}
