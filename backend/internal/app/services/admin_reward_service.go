package services

import (
	"errors"

	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/entity"
)

type AdminRewardService interface {
	CreateReward(reward *entity.Reward) (*entity.Reward, error)
	UpdateReward(id uint, data *entity.Reward) (*entity.Reward, error)
	DeleteReward(id uint) error
	GetRewardByID(id uint) (*entity.Reward, error)
	GetAllReward() ([]entity.Reward, error)
}

type adminRewardService struct {
	adminRewardRepo repository.AdminRewardRepository
}

func NewAdminRewardService(adminRewardRepo repository.AdminRewardRepository) AdminRewardService {
	return &adminRewardService{
		adminRewardRepo: adminRewardRepo,
	}
}

func (s *adminRewardService) CreateReward(reward *entity.Reward) (*entity.Reward, error) {
	if err := s.adminRewardRepo.CreateReward(reward); err != nil {
		return nil, err
	}
	return reward, nil
}

func (s *adminRewardService) UpdateReward(id uint, data *entity.Reward) (*entity.Reward, error) {
	reward, err := s.adminRewardRepo.GetRewardByID(id)
	if err != nil {
		return nil, errors.New("reward not found")
	}

	reward.RewardName = data.RewardName
	reward.PointRequired = data.PointRequired
	reward.RewardPicture = data.RewardPicture
	reward.AdminID = data.AdminID

	if err := s.adminRewardRepo.UpdateReward(reward); err != nil {
		return nil, err
	}
	return reward, nil
}

func (s *adminRewardService) DeleteReward(id uint) error {
	return s.adminRewardRepo.DeleteReward(id)
}

func (s *adminRewardService) GetAllReward() ([]entity.Reward, error) {
	return s.adminRewardRepo.GetAllReward()
}

func (s *adminRewardService) GetRewardByID(id uint) (*entity.Reward, error) {
	return s.adminRewardRepo.GetRewardByID(id)
}
