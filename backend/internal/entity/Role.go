package entity

import "gorm.io/gorm"

type Role struct {

gorm.Model

RoleID 		int 	`json:"role_id"`
RoleName 	string 	`json:"role_name"`

}