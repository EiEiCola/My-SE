package services

import (
	"errors"

	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/entity"
)

type RewardService interface {
	GetAllReward() ([]entity.Reward, error)
	GetRewardByID(id uint) (*entity.Reward, error)
}

type rewardService struct {
	rewardRepo repository.RewardRepository
}

func NewRewardService(r repository.RewardRepository) RewardService {
	return &rewardService{rewardRepo: r}
}

func (s *rewardService) GetAllReward() ([]entity.Reward, error) {
	return s.rewardRepo.GetAllReward()
}

func (s *rewardService) GetRewardByID(id uint) (*entity.Reward, error) {
	if id == 0 {
		return nil, errors.New("invalid id")
	}
	return s.rewardRepo.GetRewardByID(id)
}
