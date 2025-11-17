package entity

import (
	"gorm.io/gorm"
	
)

type ReviewImage struct {
	gorm.Model
	URL           string `json:"url"`
	IsCover       bool   `json:"is_cover"`
	SortOrder     int    `json:"sort_order"`

	//FK review ไม่มี* เพราะตถ้าจะมีรูปยังไงก้ต้องมีไอดีรีวิว
	ReviewID uint  `json:"review_id"`
	Review   Review  `gorm:"foreignKey:ReviewID;references:ID" json:"review"`

}