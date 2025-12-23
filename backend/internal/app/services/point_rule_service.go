package services

import (
	"errors"
	"strings"

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
	if strings.TrimSpace(rule.ActivityType) == "" {
		return nil, errors.New("activity_type is required")
	}
	if rule.ActivityPoint <= 0 {
		return nil, errors.New("activity_point must be greater than 0")
	}
	if rule.DailyLimit < 0 {
		return nil, errors.New("daily_limit must be zero or positive")
	}

	// ✅ description optional: trim ให้เรียบร้อย
	rule.Description = strings.TrimSpace(rule.Description)

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
	if strings.TrimSpace(data.ActivityType) != "" {
		rule.ActivityType = strings.TrimSpace(data.ActivityType)
	}

	// ✅ description: ถ้าส่งมาว่าง -> จะ "ไม่แก้" (เหมือน ActivityType)
	// ถ้าอยากให้เคลียร์ค่าได้ ให้บอก เดี๋ยวปรับเป็น pointer หรือ patch payload
	if strings.TrimSpace(data.Description) != "" {
		rule.Description = strings.TrimSpace(data.Description)
	}

	// point & limit ปกติแก้ทับ
	if data.ActivityPoint <= 0 {
		return nil, errors.New("activity_point must be greater than 0")
	}
	if data.DailyLimit < 0 {
		return nil, errors.New("daily_limit must be zero or positive")
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
