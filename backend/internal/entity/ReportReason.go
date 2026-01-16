package entity

import (
	"gorm.io/gorm"
)

type ReportReason struct {
	gorm.Model
	Title        string `json:"title" valid:"required~Title is required"`
	Description  string `json:"description"`
	DisplayOrder int    `json:"display_order"`
}
