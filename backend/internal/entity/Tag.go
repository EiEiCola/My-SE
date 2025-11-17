package entity

import
 
	
	"gorm.io/gorm"


type Tag struct {
    gorm.Model
    Name string `json:"name" gorm:"uniqueIndex;size:100"` //ป้องกันปัญหาข้อมูลซ้ำ

	Reviews []Review `gorm:"many2many:review_tags" json:"reviews"`

	

	

}