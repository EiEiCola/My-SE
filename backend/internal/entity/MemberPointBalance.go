package entity

import "gorm.io/gorm"

type MemberPointBalance struct {

gorm.Model

TotalPoint 		string `json:"total_point"`

MemberID   uint   `json:"member_id"`  
Member     Member `gorm:"foreignKey:MemberID;references:ID"`

}