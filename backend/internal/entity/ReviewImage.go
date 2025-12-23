package entity

import (
	"gorm.io/gorm"	
	"errors"
	"strings"
	
)

type ReviewImage struct {
	gorm.Model
	URL           string `json:"url"`
	IsCover       bool   `json:"is_cover"`
	SortOrder     int    `json:"sort_order"`

	//FK review ไม่มี* เพราะตถ้าจะมีรูปยังไงก้ต้องมีไอดีรีวิว
	ReviewID uint  `json:"review_id"`
	Review   Review `json:"-" gorm:"foreignKey:ReviewID;references:ID"`
	//Review   Review  `gorm:"foreignKey:ReviewID;references:ID" json:"review"`
}

func ValidateReviewImage(img ReviewImage) (bool, error) {
	if strings.TrimSpace(img.URL) == "" {
		return false, errors.New("URL is required")
	}
	if img.ReviewID == 0 {
		return false, errors.New("ReviewID is required")
	}
	if img.SortOrder < 1 {
		return false, errors.New("SortOrder must be greater than 0")
	}
	return true, nil
}
