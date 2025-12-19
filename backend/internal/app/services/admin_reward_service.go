package services

import (
	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/entity"
)

type AdminRewardService interface {
	CreateReward(payload *entity.Reward) (*entity.Reward, error)
	UpdateReward(id uint, payload *entity.Reward) (*entity.Reward, error)
	DeleteReward(id uint) error

	GetAllReward() ([]entity.Reward, error)
	GetRewardByID(id uint) (*entity.Reward, error)
}

type adminRewardService struct {
	repo repository.AdminRewardRepository
}

func NewAdminRewardService(r repository.AdminRewardRepository) AdminRewardService {
	return &adminRewardService{repo: r}
}

func (s *adminRewardService) CreateReward(payload *entity.Reward) (*entity.Reward, error) {
	if err := s.repo.Create(payload); err != nil {
		return nil, err
	}
	return payload, nil
}

func (s *adminRewardService) UpdateReward(id uint, payload *entity.Reward) (*entity.Reward, error) {
	if err := s.repo.Update(id, payload); err != nil {
		return nil, err
	}
	return s.repo.GetByID(id)
}

func (s *adminRewardService) DeleteReward(id uint) error {
	return s.repo.Delete(id)
}

// ✅ admin เห็นเฉพาะที่ยังอยู่
func (s *adminRewardService) GetAllReward() ([]entity.Reward, error) {
	return s.repo.GetAll()
}

func (s *adminRewardService) GetRewardByID(id uint) (*entity.Reward, error) {
	return s.repo.GetByID(id)
}
