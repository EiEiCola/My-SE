package repository

import (

	"errors"

	"github.com/sut68/team12/backend/internal/entity"
	"gorm.io/gorm"
)

type ResetRepository interface {
	FindMemberForReset(identifier string) (*entity.Member, *entity.MemberAccount, error)
	UpdatePassword(accountID uint, hashed string) error
}

type resetRepository struct {
	db *gorm.DB
}

func NewResetRepository(db *gorm.DB) ResetRepository {
	return &resetRepository{db}
}

func (r *resetRepository) FindMemberForReset(identifier string) (*entity.Member, *entity.MemberAccount, error) {
	var member entity.Member

	err := r.db.
		Preload("MemberAccount").
		Where("student_id = ? OR username = ?", identifier, identifier).
		First(&member).Error

	if err != nil {
		return nil, nil, errors.New("member not found")
	}

	return &member, member.MemberAccount, nil

}

func (r *resetRepository) UpdatePassword(accountID uint, hashed string) error {
	return r.db.Model(&entity.MemberAccount{}).
		Where("id = ?", accountID).
		Update("password", hashed).Error
}
