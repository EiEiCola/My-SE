package entity

import(
 
	"gorm.io/gorm"
	"errors"
	"strings"
	
	)

type Tag struct {
    gorm.Model
    Name string `json:"name" gorm:"uniqueIndex;size:100"` //  ป้องกันปัญหาข้อมูลซ้ำ

	Reviews []Review `gorm:"many2many:review_tags" json:"reviews"`
}

func ValidateTag(t Tag) (bool, error) {
	name := strings.TrimSpace(t.Name)
	if name == "" {
		return false, errors.New("Tag name is required")
	}
	if len(name) > 100 {
		return false, errors.New("Tag name must be 1-100 characters")
	}
	return true, nil
}
