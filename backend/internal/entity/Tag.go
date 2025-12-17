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
func (t *Tag) Validate() error {
	name := strings.TrimSpace(t.Name)
	if name == "" {
		return errors.New("tag name is required")
	}
	if len(name) > 100 {
		return errors.New("tag name must be <= 100")
	}
	return nil
}