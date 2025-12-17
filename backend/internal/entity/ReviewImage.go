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

func (img *ReviewImage) Validate() error {
	if img.ReviewID == 0 {
		return errors.New("review_id is required")
	}
	if strings.TrimSpace(img.URL) == "" {
		return errors.New("url is required")
	}
	if img.SortOrder < 0 {
		return errors.New("sort_order cannot be negative")
	}
	return nil
}