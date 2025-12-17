package entity

import (
	"gorm.io/gorm"
	"errors"
	"strings"
)
type Review struct {
	gorm.Model
	Title           string    `json:"title"`
	Content         string    `json:"content"`
	Rating          int       `json:"rating"`
	IsAnonymous     bool      `json:"is_anonymous"`
	HelpfulCount    int       `json:"helpful_count"`
	NotHelpfulCount int       `json:"not_helpful_count"`
	//CreatedAt       time.Time `json:"created_at"`

	MemberID   uint   `json:"member_id"`  
    Member     Member `gorm:"foreignKey:MemberID;references:ID"`

	//FK category
	MainCategoryID *uint         `json:"main_category_id"`
	MainCategory   MainCategory `gorm:"foreignKey:MainCategoryID;references:ID"`

	SubCategoryL1ID *uint          `json:"sub_category_l1_id"`
	SubCategoryL1   SubCategoryL1 `gorm:"foreignKey:SubCategoryL1ID;references:ID"`

	SubCategoryL2ID *uint          `json:"sub_category_l2_id"`
	SubCategoryL2   SubCategoryL2 `gorm:"foreignKey:SubCategoryL2ID;references:ID"`

	ReviewImages []ReviewImage `gorm:"foreignKey:ReviewID;references:ID" `
	ReviewVotes  []ReviewVote  `gorm:"foreignKey:ReviewID;references:ID"`
	Tags        []Tag        `gorm:"many2many:review_tags" json:"tags"`
    ReviewTags  []ReviewTag  `gorm:"foreignKey:ReviewID"`

	Reports []Report `gorm:"polymorphic:Target;" json:"reports"`
}

func (r *Review) Validate() error {
	title := strings.TrimSpace(r.Title)
	content := strings.TrimSpace(r.Content)

	if title == "" {
		return errors.New("title is required")
	}
	if len(title) < 3 || len(title) > 120 {
		return errors.New("title length must be 3-120")
	}

	if content == "" {
		return errors.New("content is required")
	}
	if len(content) < 10 {
		return errors.New("content length must be at least 10")
	}

	if r.Rating < 1 || r.Rating > 5 {
		return errors.New("rating must be between 1 and 5")
	}

	if r.MemberID == 0 {
		return errors.New("member_id is required")
	}

	if r.MainCategoryID == nil || *r.MainCategoryID == 0 {
		return errors.New("main_category_id is required")
	}

	// ถ้ามี L2 ต้องมี L1
	if r.SubCategoryL2ID != nil && (r.SubCategoryL1ID == nil || *r.SubCategoryL1ID == 0) {
		return errors.New("sub_category_l1_id is required when sub_category_l2_id is provided")
	}

	// counts ห้ามติดลบ
	if r.HelpfulCount < 0 || r.NotHelpfulCount < 0 {
		return errors.New("vote counts cannot be negative")
	}

	return nil
}