package repository

import (
	"errors"

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
	if id == 0 {
		return nil, errors.New("invalid id")
	}

	var reward entity.Reward
	if err := r.db.Preload("Admin").First(&reward, id).Error; err != nil {
		return nil, err
	}
	return &reward, nil
}

func (r *rewardRepository) GetAllReward() ([]entity.Reward, error) {
	var rewards []entity.Reward
	err := r.db.Preload("Admin").Order("created_at DESC").Find(&rewards).Error
	return rewards, err
}
