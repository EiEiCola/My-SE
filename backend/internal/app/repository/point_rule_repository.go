package repository

import (
	"github.com/sut68/team12/backend/internal/entity"
	"gorm.io/gorm"
)

type PointRuleRepository interface {
	GetPointRuleByID(id uint) (*entity.PointRule, error)
	GetAllPointRule() ([]entity.PointRule, error)
}

type pointRuleRepository struct {
	db *gorm.DB
}

func NewPointRuleRepository(db *gorm.DB) PointRuleRepository {
	return &pointRuleRepository{db: db}
}

func (r *pointRuleRepository) GetPointRuleByID(id uint) (*entity.PointRule, error) {
	var rule entity.PointRule
	if err := r.db.First(&rule, id).Error; err != nil {
		return nil, err
	}
	return &rule, nil
}

func (r *pointRuleRepository) GetAllPointRule() ([]entity.PointRule, error) {
	var rules []entity.PointRule
	err := r.db.Find(&rules).Error
	return rules, err
}
