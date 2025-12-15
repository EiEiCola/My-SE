package entity

import (
	"gorm.io/gorm"
)

type MemberAccount struct {
    
	gorm.Model

    Email    string `json:"email" gorm:"unique"`
    Password string `json:"password"`

    IsLocked     bool   `json:"is_locked" gorm:"not null;default:false"`
	LockedReason string `json:"locked_reason" gorm:"type:text"`

    RoleID uint `json:"role_id"`
    Role   Role `gorm:"foreignKey:RoleID;references:ID"`

    MemberID uint   `json:"member_id"`
    Member   Member `gorm:"foreignKey:MemberID;references:ID"`

}
