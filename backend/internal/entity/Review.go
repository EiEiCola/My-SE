package entity

import (
	"errors"
	"strings"

	"gorm.io/gorm"
)

type Review struct {
	gorm.Model
	Title           string `json:"title"`
	Content         string `json:"content"`
	Rating          int    `json:"rating"`
	IsAnonymous     bool   `json:"is_anonymous"`
	HelpfulCount    int    `json:"helpful_count"`
	NotHelpfulCount int    `json:"not_helpful_count"`
	//CreatedAt       time.Time `json:"created_at"`

	MemberID uint   `json:"member_id"`
	Member   Member `gorm:"foreignKey:MemberID;references:ID" json:"Member"`

	//FK category
	MainCategoryID *uint        `json:"main_category_id"`
	MainCategory   MainCategory `gorm:"foreignKey:MainCategoryID;references:ID" json:"MainCategory"`

	SubCategoryL1ID *uint         `json:"sub_category_l1_id"`
	SubCategoryL1   SubCategoryL1 `gorm:"foreignKey:SubCategoryL1ID;references:ID" json:"SubCategoryL1"`

	SubCategoryL2ID *uint         `json:"sub_category_l2_id"`
	SubCategoryL2   SubCategoryL2 `gorm:"foreignKey:SubCategoryL2ID;references:ID" json:"SubCategoryL2"`

	ReviewImages []ReviewImage `gorm:"foreignKey:ReviewID;references:ID" json:"ReviewImages"`
	ReviewVotes  []ReviewVote  `gorm:"foreignKey:ReviewID;references:ID" json:"ReviewVotes"`
	Tags         []Tag         `gorm:"many2many:review_tags" json:"tags"`
	ReviewTags   []ReviewTag   `gorm:"foreignKey:ReviewID" json:"ReviewTags"`

	Reports []Report `gorm:"polymorphic:Target;" json:"Reports"`

	DeletedByType     string `json:"deleted_by_type" gorm:"type:varchar(10);default:''"`
	AdminDeleteReason string `json:"admin_delete_reason"`
}

func ValidateReview(r Review) (bool, error) {
	if strings.TrimSpace(r.Title) == "" {
		return false, errors.New("Title is required")
	}
	if strings.TrimSpace(r.Content) == "" {
		return false, errors.New("Content is required")
	}
	if r.Rating < 1 || r.Rating > 5 {
		return false, errors.New("Rating must be between 1 and 5")
	}
	if r.MemberID == 0 {
		return false, errors.New("MemberID is required")
	}

	// ✅ บังคับแค่ Main
	if r.MainCategoryID == nil || *r.MainCategoryID == 0 {
		return false, errors.New("MainCategoryID is required")
	}

	// ✅ Sub1 / Sub2 ไม่บังคับ
	// แต่ถ้าเลือก Sub2 -> ต้องมี Sub1
	if r.SubCategoryL2ID != nil && *r.SubCategoryL2ID != 0 {
		if r.SubCategoryL1ID == nil || *r.SubCategoryL1ID == 0 {
			return false, errors.New("SubCategoryL1ID is required when SubCategoryL2ID is provided")
		}
	}

	if r.HelpfulCount < 0 || r.NotHelpfulCount < 0 {
		return false, errors.New("Vote counts must be non-negative")
	}

	return true, nil
}
