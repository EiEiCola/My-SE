package services

import (
	"errors"

	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/entity"
)

type PointRuleService interface {
	Create(rule *entity.PointRule) (*entity.PointRule, error)
	Update(id uint, data *entity.PointRule) (*entity.PointRule, error)
	Delete(id uint) error
	GetByID(id uint) (*entity.PointRule, error)
	GetAll() ([]entity.PointRule, error)
}

type pointRuleService struct {
	pointRuleRepo repository.PointRuleRepository
}

func NewPointRuleService(pointRuleRepo repository.PointRuleRepository) PointRuleService {
	return &pointRuleService{pointRuleRepo: pointRuleRepo}
}

func (s *pointRuleService) Create(rule *entity.PointRule) (*entity.PointRule, error) {
	if rule.ActivityType == "" {
		return nil, errors.New("activity_type is required")
	}
	if err := s.pointRuleRepo.Create(rule); err != nil {
		return nil, err
	}
	return rule, nil
}

func (s *pointRuleService) Update(id uint, data *entity.PointRule) (*entity.PointRule, error) {
	rule, err := s.pointRuleRepo.GetByID(id)
	if err != nil {
		return nil, errors.New("point rule not found")
	}

	// อัปเดตฟิลด์หลัก
	if data.ActivityType != "" {
		rule.ActivityType = data.ActivityType
	}
	rule.ActivityPoint = data.ActivityPoint
	rule.DailyLimit = data.DailyLimit

	if err := s.pointRuleRepo.Update(rule); err != nil {
		return nil, err
	}
	return rule, nil
}

func (s *pointRuleService) Delete(id uint) error {
	return s.pointRuleRepo.Delete(id)
}

func (s *pointRuleService) GetAll() ([]entity.PointRule, error) {
	return s.pointRuleRepo.GetAll()
}

func (s *pointRuleService) GetByID(id uint) (*entity.PointRule, error) {
	return s.pointRuleRepo.GetByID(id)
}
