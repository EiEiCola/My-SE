package repository

import (
	"errors"

	"github.com/sut68/team12/backend/internal/entity"
	"gorm.io/gorm"
)

type AdminRewardRepository interface {
	CreateReward(reward *entity.Reward) error
	UpdateReward(reward *entity.Reward) error
	DeleteReward(id uint) error
	GetRewardByID(id uint) (*entity.Reward, error)
	GetAllReward() ([]entity.Reward, error)
}

type adminRewardRepository struct {
	db *gorm.DB
}

func NewAdminRewardRepository(db *gorm.DB) AdminRewardRepository {
	return &adminRewardRepository{
		db: db,
	}
}

func (r *adminRewardRepository) CreateReward(reward *entity.Reward) error {
	return r.db.Create(reward).Error
}

func (r *adminRewardRepository) UpdateReward(reward *entity.Reward) error {
	// Save จะ update ตาม PK ของ struct (gorm.Model.ID)
	return r.db.Save(reward).Error
}

func (r *adminRewardRepository) DeleteReward(id uint) error {
	// ✅ ลบ "จริง" ออกจาก DB (ไม่ใช่ soft delete)
	// ถ้าใช้ gorm.Model จะมี DeletedAt -> Delete ปกติจะเป็น soft delete
	result := r.db.Unscoped().Delete(&entity.Reward{}, id)

	if result.Error != nil {
		return result.Error
	}

	// ✅ ถ้าไม่เจอ record จะไม่ error แต่ RowsAffected = 0
	if result.RowsAffected == 0 {
		return errors.New("reward not found")
	}

	return nil
}

func (r *adminRewardRepository) GetRewardByID(id uint) (*entity.Reward, error) {
	var reward entity.Reward
	if err := r.db.First(&reward, id).Error; err != nil {
		return nil, err
	}
	return &reward, nil
}

func (r *adminRewardRepository) GetAllReward() ([]entity.Reward, error) {
	var rewards []entity.Reward
	if err := r.db.Find(&rewards).Error; err != nil {
		return nil, err
	}
	return rewards, nil
}
