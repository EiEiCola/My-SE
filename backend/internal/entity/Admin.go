package entity

import (
	"errors"
	"strings"

	"gorm.io/gorm"
)

type Admin struct {
	gorm.Model

	Username string `json:"username" gorm:"uniqueIndex;not null"`

	// ✅ ใช้ยืนยันตอนลืมรหัส (ห้ามเก็บเลขเต็ม)
	NationalIDHash  string `json:"-" gorm:"not null"`
	NationalIDLast4 string `json:"national_id_last4"` // optional

	FirstName      string `json:"first_name"`
	LastName       string `json:"last_name"`
	ProfilePicture string `json:"profile_picture" gorm:"default:''"`
	PhoneNumber    string `json:"phone_number" gorm:"uniqueIndex"`

	MemberAccountID uint          `json:"member_account_id" gorm:"not null;uniqueIndex"`
	MemberAccount   MemberAccount `gorm:"foreignKey:MemberAccountID;references:ID"`

	PollHistorys  []PollHistory  `gorm:"foreignKey:AdminID;references:ID;constraint:false" json:"poll_historys"`
	Announcements []Announcement `gorm:"foreignKey:AdminID;references:ID;constraint:false" json:"announcements"`
}

func ValidateAdmin(a Admin) (bool, error) {
	if strings.TrimSpace(a.Username) == "" {
		return false, errors.New("Username is required")
	}

	// hash ต้องมีเสมอ (ใช้ verify ตอนลืมรหัส)
	if strings.TrimSpace(a.NationalIDHash) == "" {
		return false, errors.New("NationalIDHash is required")
	}

	// ถ้ามี last4 ให้เช็คว่าต้องยาว 4 ตัว (กันส่งมั่ว)
	if s := strings.TrimSpace(a.NationalIDLast4); s != "" && len(s) != 4 {
		return false, errors.New("NationalIDLast4 must be 4 characters")
	}

	if a.MemberAccountID == 0 {
		return false, errors.New("MemberAccountID is required")
	}

	return true, nil
}
