package entity

import "gorm.io/gorm"

type MemberPointBalance struct {

gorm.Model

MemberPointBalanceID	int		`json:"member_point_balance_id"`

TotalPoint 				int `json:"total_point"`

MemberID   				uint   `json:"member_id"`  
Member     				Member `gorm:"foreignKey:MemberID;references:ID"`

}