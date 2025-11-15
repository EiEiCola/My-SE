package entity

import (
	"gorm.io/gorm"
	"time"
)

type ReviewImage struct {
	gorm.Model
	URL           string `json:"url"`
	IsCover       bool   `json:"is_cover"`
	SortOrder     int    `json:"sort_order"`

	
	ReviewID *uint  `json:"review_id"`
	Review   Review  `json:"review"`

}