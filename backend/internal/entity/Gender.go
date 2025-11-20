package entity

import "gorm.io/gorm"

type Gender struct {

gorm.Model

GenderID 		int  	`json:"gender_id"`
GenderName 		string 	`json:"gender_name"`

}