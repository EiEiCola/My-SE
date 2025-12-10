package repository

import (
	"errors"

	"github.com/sut68/team12/backend/internal/entity"
	"gorm.io/gorm"
)

type AuthRepository interface {
	FindByEmail(email string) (*entity.MemberAccount, error)
	Create(account *entity.MemberAccount) error
}

type authRepository struct {
	db *gorm.DB
}

func NewAuthRepository(db *gorm.DB) AuthRepository {
	return &authRepository{db}
}

// 🔍 หา account จาก email
func (r *authRepository) FindByEmail(email string) (*entity.MemberAccount, error) {
	var acc entity.MemberAccount

	err := r.db.Where("email = ?", email).First(&acc).Error
	if err != nil {
		return nil, errors.New("email not found")
	}

	return &acc, nil
}

// ➕ เพิ่ม account ใหม่ลง DB
func (r *authRepository) Create(account *entity.MemberAccount) error {
	return r.db.Create(account).Error
}
