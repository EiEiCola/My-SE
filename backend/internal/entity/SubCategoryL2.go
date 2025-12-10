package entity

import (
	"time"

	"gorm.io/gorm"
)

type SubCategoryL2 struct{
	gorm.Model
	Title 	 string    `json:"title"`
	Description string    `json:"description"`
	OrderIndex  int       `json:"order_index"`

	// FK
	SubCategoryL1ID  uint	  `json:"sub_category_l1_id"`
	CreatedByAdmin   uint	  `json:"created_by_admin"`

	// Timestapms
	CreatedAAt time.Time `json:"created_at"`
	
	// Relations
	Posts		  []Post          `gorm:"foreignKey:SubCategoryL2ID" json:"posts"`

	//Review relations
	Reviews       []Review        `gorm:"foreignKey:SubCategoryL2ID" json:"reviews"`
}