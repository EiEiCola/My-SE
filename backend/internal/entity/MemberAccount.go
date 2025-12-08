package entity

import (
	"gorm.io/gorm"
)

type MemberAccount struct {
    
	gorm.Model

	MemberAccountID uint `json:"member_account_id"`

    Email    string `json:"email" gorm:"unique"`
    Password string `json:"password"`

    RoleID uint `json:"role_id"`
    Role   Role `gorm:"foreignKey:RoleID;references:ID"`

    MemberID uint   `json:"member_id"`
    Member   Member `gorm:"foreignKey:MemberID;references:ID"`
}
