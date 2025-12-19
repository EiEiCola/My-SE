package repository

import (
	"github.com/sut68/team12/backend/internal/entity"
	"gorm.io/gorm"
)

type RewardRepository interface {
	GetRewardByID(id uint) (*entity.Reward, error)
	GetAllReward() ([]entity.Reward, error)
}

type rewardRepository struct {
	db *gorm.DB
}

func NewRewardRepository(db *gorm.DB) RewardRepository {
	return &rewardRepository{db: db}
}

func (r *rewardRepository) GetRewardByID(id uint) (*entity.Reward, error) {
	var reward entity.Reward
	if err := r.db.First(&reward, id).Error; err != nil {
		return nil, err
	}
	return &reward, nil
}

func (r *rewardRepository) GetAllReward() ([]entity.Reward, error) {
	var rewards []entity.Reward
	err := r.db.Order("created_at DESC").Find(&rewards).Error
	return rewards, err
}
