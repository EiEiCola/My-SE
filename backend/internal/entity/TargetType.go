package entity

import (
	"gorm.io/gorm"
)

type TargetType struct {
	gorm.Model
	Name         string `json:"name" gorm:"column:name;uniqueIndex" valid:"required~Name is required"`
	Description  string `json:"description" gorm:"column:description"`
	DisplayOrder int    `json:"display_order" gorm:"column:display_order"`
}

// TableName overrides the table name used by Report to `target_types`
func (TargetType) TableName() string {
	return "target_types"
}
