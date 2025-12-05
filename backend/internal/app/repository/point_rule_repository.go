package repository

import (
	
    "gorm.io/gorm"
    "github.com/sut68/team12/backend/internal/entity"
)

type PointRuleRepository interface {

    // ดึง rule ตาม ID (เวลาจะ earn point)
    GetByID(id uint) (*entity.PointRule, error)

    // ดึงทั้งหมด (ใช้ตอน admin ดูรายการ rule)
    GetAll() ([]entity.PointRule, error)

    // เพิ่ม rule ใหม่
    Create(rule *entity.PointRule) error

    // อัปเดต rule
    Update(rule *entity.PointRule) error

    // ลบ rule
    Delete(id uint) error
}

type pointRuleRepository struct {
    db *gorm.DB
}

func NewPointRuleRepository(db *gorm.DB) PointRuleRepository {
    return &pointRuleRepository{db}
}

func (r *pointRuleRepository) GetByID(id uint) (*entity.PointRule, error) {
    var rule entity.PointRule
    err := r.db.Where("id = ?", id).First(&rule).Error
    return &rule, err
}

func (r *pointRuleRepository) GetAll() ([]entity.PointRule, error) {
    var rules []entity.PointRule
    err := r.db.Order("created_at DESC").Find(&rules).Error
    return rules, err
}

func (r *pointRuleRepository) Create(rule *entity.PointRule) error {
    return r.db.Create(rule).Error
}

func (r *pointRuleRepository) Update(rule *entity.PointRule) error {
    return r.db.Save(rule).Error
}

func (r *pointRuleRepository) Delete(id uint) error {
    return r.db.Delete(&entity.PointRule{}, id).Error
}
