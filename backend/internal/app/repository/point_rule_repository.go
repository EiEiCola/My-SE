package repository

import (
	"errors"

	"github.com/sut68/team12/backend/internal/entity"
	"gorm.io/gorm"
)

type PointRuleRepository interface {
	// CRUD หลัก
	Create(rule *entity.PointRule) error
	Update(rule *entity.PointRule) error
	Delete(id uint) error // ✅ now hard delete (admin use)
	GetByID(id uint) (*entity.PointRule, error)
	GetAll() ([]entity.PointRule, error)
	GetByActivityType(activityType string) (*entity.PointRule, error)

	// Admin utilities
	GetByIDIncludingDeleted(id uint) (*entity.PointRule, error)
	GetAllIncludingDeleted() ([]entity.PointRule, error)
	Restore(id uint) error
	HardDelete(id uint) error
}

type pointRuleRepository struct {
	db *gorm.DB
}

func NewPointRuleRepository(db *gorm.DB) PointRuleRepository {
	return &pointRuleRepository{db: db}
}

func (r *pointRuleRepository) Create(rule *entity.PointRule) error {
	return r.db.Create(rule).Error
}

func (r *pointRuleRepository) Update(rule *entity.PointRule) error {
	return r.db.Save(rule).Error
}

// ✅ Delete = HARD delete (remove row from DB)
// เหมาะกับฝั่ง Admin เพราะ activity_type มักทำ unique ไว้ ถ้า soft delete จะชนตอนสร้างซ้ำ
func (r *pointRuleRepository) Delete(id uint) error {
	result := r.db.Unscoped().Delete(&entity.PointRule{}, id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("point rule not found")
	}
	return nil
}

func (r *pointRuleRepository) GetByID(id uint) (*entity.PointRule, error) {
	var rule entity.PointRule
	if err := r.db.First(&rule, id).Error; err != nil {
		return nil, err
	}
	return &rule, nil
}

func (r *pointRuleRepository) GetAll() ([]entity.PointRule, error) {
	var rules []entity.PointRule
	err := r.db.Order("id desc").Find(&rules).Error
	return rules, err
}

func (r *pointRuleRepository) GetByActivityType(activityType string) (*entity.PointRule, error) {
	var rule entity.PointRule
	if err := r.db.Where("activity_type = ?", activityType).First(&rule).Error; err != nil {
		return nil, err
	}
	return &rule, nil
}

// ---------------- Admin utilities ----------------

func (r *pointRuleRepository) GetByIDIncludingDeleted(id uint) (*entity.PointRule, error) {
	var rule entity.PointRule
	if err := r.db.Unscoped().First(&rule, id).Error; err != nil {
		return nil, err
	}
	return &rule, nil
}

func (r *pointRuleRepository) GetAllIncludingDeleted() ([]entity.PointRule, error) {
	var rules []entity.PointRule
	err := r.db.Unscoped().Order("id desc").Find(&rules).Error
	return rules, err
}

func (r *pointRuleRepository) Restore(id uint) error {
	result := r.db.Unscoped().
		Model(&entity.PointRule{}).
		Where("id = ?", id).
		Update("deleted_at", nil)

	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("point rule not found")
	}
	return nil
}

func (r *pointRuleRepository) HardDelete(id uint) error {
	result := r.db.Unscoped().Delete(&entity.PointRule{}, id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("point rule not found")
	}
	return nil
}
