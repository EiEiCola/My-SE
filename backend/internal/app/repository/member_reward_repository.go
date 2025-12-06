package repository

import (
	"github.com/sut68/team12/backend/internal/entity"
	"gorm.io/gorm"
)

type MemberRewardRepository interface {
	CreateMemberReward(mr *entity.MemberReward) error
	GetMemberRewardByMemberID(memberID uint) ([]entity.MemberReward, error)
}

type memberRewardRepository struct {
	db *gorm.DB
}

func NewMemberRewardRepository(db *gorm.DB) MemberRewardRepository {
	return &memberRewardRepository{db: db}
}

func (r *memberRewardRepository) CreateMemberReward(mr *entity.MemberReward) error {
	return r.db.Create(mr).Error
}

func (r *memberRewardRepository) GetMemberRewardByMemberID(memberID uint) ([]entity.MemberReward, error) {
	var mrs []entity.MemberReward

	err := r.db.
		Preload("Reward").
		Where("member_id = ?", memberID).
		Order("created_at DESC").
		Find(&mrs).Error

	return mrs, err
}
