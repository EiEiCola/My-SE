package entity

import (
	"time"

	"gorm.io/gorm"
)

type MainCategory struct {
	gorm.Model
	Title	   string    `json:"title"`
	Description string    `json:"description"`
	Icon	   string    `json:"icon"`
	OrderIndex  int       `json:"order_index"`

	// FK
	CreatedByAdmin uint	  `json:"created_by_admin"`

	// Timestapms
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// Relations
	SubCategoriesL1 []SubCategoryL1 `gorm:"foreignKey:MainCategoryID" json:"sub_categories_l1"`
	Posts		    []Post          `gorm:"foreignKey:MainCategoryID" json:"posts"`

	//Review relations
	Reviews         []Review        `gorm:"foreignKey:MainCategoryID" json:"reviews"`

	//Poll relations
	Polls           []Poll          `gorm:"foreignKey:MainCategoryID" json:"polls"`

	// Polymorphic relation for Reports
	Reports []Report `gorm:"polymorphic:Target;" json:"reports"`
}