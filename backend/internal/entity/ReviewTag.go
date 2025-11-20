package entity

import (
	
	"gorm.io/gorm"
)


type ReviewTag struct {
	gorm.Model
    ReviewID uint `json:"review_id"`
    TagID    uint `json:"tag_id"`
}
