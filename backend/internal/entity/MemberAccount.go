package entity

import (
	"errors"
	"strings"

	"github.com/asaskevich/govalidator"
	"gorm.io/gorm"
)

type MemberAccount struct {
	gorm.Model

	Email    string `json:"email" gorm:"unique" valid:"required~Email is required,email~Email is invalid"`
	Password string `json:"password" valid:"required~Password is required"`

	IsLocked     bool   `json:"is_locked" gorm:"not null;default:false"`
	LockedReason string `json:"locked_reason" gorm:"type:text"`

	RoleID uint `json:"role_id" valid:"required~RoleID is required"`
	Role   Role `gorm:"foreignKey:RoleID;references:ID" valid:"-"` // ✅ ข้าม validation relation

	MemberID uint   `json:"member_id" valid:"required~MemberID is required"`
	Member   Member `gorm:"foreignKey:MemberID;references:ID" valid:"-"` // ✅ ข้าม validation relation
}

func init() {
	govalidator.SetFieldsRequiredByDefault(false)
}

func ValidateMemberAccount(a MemberAccount) (bool, error) {
	// ตรวจเฉพาะ field ของ MemberAccount ตาม tag (Email/Password/RoleID/MemberID)
	ok, err := govalidator.ValidateStruct(a)
	if !ok {
		return ok, err
	}

	// ตรวจ password เพิ่มเอง (กันปัญหา validator ความยาวไม่รองรับ)
	if len(strings.TrimSpace(a.Password)) < 8 {
		return false, errors.New("Password must be at least 8 characters")
	}

	return true, nil
}
