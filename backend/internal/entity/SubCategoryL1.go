package entity

import (
	"time"

	"gorm.io/gorm"
)

type SubCategoryL1 struct{
	gorm.Model
	Title		string    `json:"title"`
	Description string    `json:"description"`
	OrderIndex  int       `json:"order_index"`

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