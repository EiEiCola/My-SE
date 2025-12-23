package entity

import (
	"errors"

	"gorm.io/gorm"
)

type MemberPointBalance struct {
	gorm.Model

	TotalPoint int `json:"total_point" gorm:"not null;default:0"`

	MemberID uint   `json:"member_id" gorm:"not null;uniqueIndex"`
	Member   Member `gorm:"foreignKey:MemberID;references:ID"`
}

func ValidateMemberPointBalance(b MemberPointBalance) (bool, error) {
	if b.MemberID == 0 {
		return false, errors.New("MemberID is required")
	}

	// กันแต้มติดลบ
	if b.TotalPoint < 0 {
		return false, errors.New("TotalPoint must be zero or positive")
	}

	return true, nil
}
