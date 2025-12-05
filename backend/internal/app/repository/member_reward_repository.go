package repository

import (
	
    "gorm.io/gorm"
    "github.com/sut68/team12/backend/internal/entity"
)

type MemberRewardRepository interface {

    // เมื่อ member แลกของรางวัล
    Create(mr *entity.MemberReward) error
}

type memberRewardRepository struct {
    db *gorm.DB
}

func NewMemberRewardRepository(db *gorm.DB) MemberRewardRepository {
    return &memberRewardRepository{db}
}

func (r *memberRewardRepository) Create(mr *entity.MemberReward) error {
    return r.db.Create(mr).Error
}
