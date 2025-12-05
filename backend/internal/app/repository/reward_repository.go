package repository

import (
	
    "gorm.io/gorm"
    "github.com/sut68/team12/backend/internal/entity"
)

type RewardRepository interface {
    GetAll() ([]entity.Reward, error)
    GetByID(id uint) (*entity.Reward, error)
    Create(r *entity.Reward) error
    Update(r *entity.Reward) error
    Delete(id uint) error
}

type rewardRepository struct {
    db *gorm.DB
}

func NewRewardRepository(db *gorm.DB) RewardRepository {
    return &rewardRepository{db}
}

func (r *rewardRepository) GetAll() ([]entity.Reward, error) {
    var rewards []entity.Reward
    err := r.db.Order("created_at DESC").Find(&rewards).Error
    return rewards, err
}

func (r *rewardRepository) GetByID(id uint) (*entity.Reward, error) {
    var reward entity.Reward
    err := r.db.Where("id = ?", id).First(&reward).Error
    return &reward, err
}

func (r *rewardRepository) Create(reward *entity.Reward) error {
    return r.db.Create(reward).Error
}

func (r *rewardRepository) Update(reward *entity.Reward) error {
    return r.db.Save(reward).Error
}

func (r *rewardRepository) Delete(id uint) error {
    return r.db.Delete(&entity.Reward{}, id).Error
}
