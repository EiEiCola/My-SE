package services

import (
	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/entity"
)

type PointRuleService interface {
	GetAllPointRule() ([]entity.PointRule, error)
}

type pointRuleService struct {
	pointRuleRepo repository.PointRuleRepository
}

func NewPointRuleService(
	pointRuleRepo repository.PointRuleRepository,
) PointRuleService {
	return &pointRuleService{
		pointRuleRepo: pointRuleRepo,
	}
}

func (s *pointRuleService) GetAllPointRule() ([]entity.PointRule, error) {
	return s.pointRuleRepo.GetAllPointRule()
}
