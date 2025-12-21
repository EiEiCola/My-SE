package repository

import (
	"errors"

	"github.com/sut68/team12/backend/internal/entity"
	"gorm.io/gorm"
)

type AdminRewardRepository interface {
	Create(payload *entity.Reward) error
	Update(id uint, payload *entity.Reward) error
	Delete(id uint) error

	GetAll() ([]entity.Reward, error)
	GetByID(id uint) (*entity.Reward, error)
}

type adminRewardRepository struct {
	db *gorm.DB
}

func NewAdminRewardRepository(db *gorm.DB) AdminRewardRepository {
	return &adminRewardRepository{db: db}
}

func (r *adminRewardRepository) Create(payload *entity.Reward) error {
	if payload == nil {
		return errors.New("payload is required")
	}
	return r.db.Create(payload).Error
}

func (r *adminRewardRepository) Update(id uint, payload *entity.Reward) error {
	if id == 0 {
		return errors.New("invalid id")
	}
	if payload == nil {
		return errors.New("payload is required")
	}

	// ✅ ไม่ควร update admin_id (creator) ตอนแก้ไข reward
	return r.db.Model(&entity.Reward{}).
		Where("id = ?", id).
		Updates(map[string]any{
			"reward_name":    payload.RewardName,
			"point_required": payload.PointRequired,
			"reward_picture": payload.RewardPicture,
		}).Error
}

// 🔥 HARD DELETE (ลบจริง)
func (r *adminRewardRepository) Delete(id uint) error {
	if id == 0 {
		return errors.New("invalid id")
	}
	return r.db.Unscoped().Delete(&entity.Reward{}, id).Error
}

// ✅ ดึงเฉพาะที่ยังไม่ถูกลบ (admin ไม่เห็นของที่ลบแล้ว)
func (r *adminRewardRepository) GetAll() ([]entity.Reward, error) {
	var rewards []entity.Reward
	err := r.db.Preload("Admin").Order("created_at DESC").Find(&rewards).Error
	return rewards, err
}

func (r *adminRewardRepository) GetByID(id uint) (*entity.Reward, error) {
	if id == 0 {
		return nil, errors.New("invalid id")
	}

	var reward entity.Reward
	if err := r.db.Preload("Admin").First(&reward, id).Error; err != nil {
		return nil, err
	}
	return &reward, nil
}
