package entity

import (
	"time"
	"gorm.io/gorm"
)

type SubCategoryL2 struct{
	gorm.Model
	Title 	 string       `valid:"required~Title is required,stringlength(2|60)~Title must be between 2 and 60 characters" json:"title"`
	Description string    `valid:"required~Description is required,stringlength(1|300)~Description must not exceed 300 characters" json:"description"`
	OrderIndex  int       `valid:"optional,range(0|100)~Order index must be >= 0" json:"order_index"`

	// FK
	SubCategoryL1ID  uint	  `json:"sub_category_l1_id"`
	CreatedByAdmin   uint	  `json:"created_by_admin"`

	// Timestapms
	CreatedAt time.Time `json:"created_at"`
	
	// Relations
	Posts   []Post   `gorm:"foreignKey:SubCategoryL2ID;references:ID" json:"posts"` 
    Reviews []Review `gorm:"foreignKey:SubCategoryL2ID;references:ID" json:"reviews"`
    Polls   []Poll   `gorm:"foreignKey:SubCategoryL2ID;references:ID" json:"polls"`
}