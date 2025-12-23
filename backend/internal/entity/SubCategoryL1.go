package entity

import (
	"time"

	"gorm.io/gorm"
)

type SubCategoryL1 struct{
	gorm.Model
	Title		string    `valid:"required~Title is required,stringlength(2|60)~Title must be between 2 and 60 characters" json:"title"`
	Description string    `valid:"required~Description is required,stringlength(1|300)~Description must not exceed 300 characters" json:"description"`
	OrderIndex  int       `valid:"optional,range(0|100)~Order index must be >= 0" json:"order_index"`

	// FK
	MainCategoryID  uint	  `json:"main_category_id"`
	CreatedByAdmin  uint	  `json:"created_by_admin"`
	
	// Timestapms
	CreatedAt time.Time `json:"created_at"`

	// Relations
	SubCategoriesL2 []SubCategoryL2 `gorm:"foreignKey:SubCategoryL1ID" json:"sub_categories_l2"`
	Posts		    []Post          `gorm:"foreignKey:SubCategoryL1ID" json:"posts"`

	//Review relations
	Reviews       []Review        `gorm:"foreignKey:SubCategoryL1ID" json:"reviews"`

	//Poll relations
	Polls         []Poll          `gorm:"foreignKey:SubCategoryL1ID" json:"polls"`
}