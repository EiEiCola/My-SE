package entity

import (
	"errors"
	"strings"

	"github.com/asaskevich/govalidator"
	"gorm.io/gorm"
)

type MemberAccount struct {
	gorm.Model

	Email        string `json:"email" gorm:"uniqueIndex;not null" valid:"required~Email is required,email~Email is invalid"`
	PasswordHash string `json:"-" gorm:"not null"` // ✅ เก็บ hash เท่านั้น

	IsLocked     bool   `json:"is_locked" gorm:"not null;default:false"`
	LockedReason string `json:"locked_reason" gorm:"type:text"`

	RoleID uint `json:"role_id" gorm:"not null" valid:"required~RoleID is required"`
	Role   Role `json:"role" gorm:"foreignKey:RoleID;references:ID" valid:"-"`

	// optional: reverse relations (ไม่จำเป็นต้อง preload เสมอ)
	Member *Member `json:"-" gorm:"constraint:OnUpdate:CASCADE,OnDelete:SET NULL;"`
	Admin  *Admin  `json:"-" gorm:"constraint:OnUpdate:CASCADE,OnDelete:SET NULL;"`
}

func init() {
	govalidator.SetFieldsRequiredByDefault(false)
}

func ValidateAccountRegisterInput(email, password string, roleID uint) (bool, error) {
	// validation ของ password ควรอยู่ใน DTO/service มากกว่า entity DB
	if strings.TrimSpace(email) == "" {
		return false, errors.New("Email is required")
	}
	if len(strings.TrimSpace(password)) < 8 {
		return false, errors.New("Password must be at least 8 characters")
	}
	if roleID == 0 {
		return false, errors.New("RoleID is required")
	}
	return true, nil
}
