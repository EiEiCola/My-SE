package entity

import (
	"time"

	"gorm.io/gorm"
)

type MainCategory struct {
	gorm.Model
	Title       string `valid:"required~Title is required,stringlength(2|60)~Title must be between 2 and 60 characters" json:"title"`
	Description string `valid:"required~Description is required,stringlength(1|300)~Description must not exceed 300 characters" json:"description"`
	Icon        string `valid:"required~Icon is required,in(Book|School|Tech|Music|Food|Travel|Shopping|Health|Sports|Movie|Game|Beauty|Home|Car|Pet|Fashion|Finance|Art|Photography|News)~Icon must be one of the allowed values" json:"icon"`
	OrderIndex  int    `valid:"range(0|200)~Order index must be >= 0" json:"order_index"`

	// FK
	CreatedByAdmin uint `json:"created_by_admin"`

	// Timestapms
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// Relations
	SubCategoriesL1 []SubCategoryL1 `gorm:"foreignKey:MainCategoryID" json:"sub_categories_l1"`
	Posts           []Post          `gorm:"foreignKey:MainCategoryID" json:"posts"`

	//Review relations
	Reviews []Review `gorm:"foreignKey:MainCategoryID" json:"reviews"`

	//Poll relations
	Polls []Poll `gorm:"foreignKey:MainCategoryID" json:"polls"`

	// Polymorphic relation for Reports
	Reports []Report `gorm:"polymorphic:Target;" json:"reports"`
}
