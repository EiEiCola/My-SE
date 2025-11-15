package entity

import "gorm.io/gorm"

type Admin struct {

gorm.Model

FirstName 	string `json:"first_name"`
LastName 	string `json:"last_name"`
Email 		string `json:"email"`

}