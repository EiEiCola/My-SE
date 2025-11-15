package entity

import "gorm.io/gorm"

type MemberAccount struct {

gorm.Model

Email 		string `json:"email"`
Password 	string `json:"password"`

RoleID    uint   `json:"role_id"`  
Role      Role `gorm:"foreignKey:RoleID;references:ID"` 

}