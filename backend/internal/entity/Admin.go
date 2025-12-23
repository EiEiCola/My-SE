package entity

import (
	"errors"
	"strings"

	"gorm.io/gorm"
)

type Admin struct {
	gorm.Model

	Username string `json:"username" gorm:"uniqueIndex;not null"`
	FirstName      string `json:"first_name"`
	LastName       string `json:"last_name"`
	ProfilePicture string `json:"profile_picture" gorm:"default:''"`

	// ถ้า optional จริง แนะนำเป็น *string เพื่อไม่ชน unique ตอนเป็น ""
	PhoneNumber *string `json:"phone_number" gorm:"uniqueIndex"`

	// ✅ 1:1 กับ Account
	MemberAccountID uint           `json:"member_account_id" gorm:"uniqueIndex;not null"`
	MemberAccount   *MemberAccount `json:"-" gorm:"foreignKey:MemberAccountID;references:ID"`

	PollHistorys  []PollHistory  `gorm:"foreignKey:AdminID;references:ID;constraint:false" json:"poll_historys"`
	Announcements []Announcement `gorm:"foreignKey:AdminID;references:ID;constraint:false" json:"announcements"`
}

func ValidateAdmin(a Admin) (bool, error) {
	if strings.TrimSpace(a.Username) == "" {
		return false, errors.New("Username is required")
	}
	if a.MemberAccountID == 0 {
		return false, errors.New("MemberAccountID is required")
	}
	return true, nil
}
