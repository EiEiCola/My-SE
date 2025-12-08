package services

import (
	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/entity"
)

type RewardService interface {
	GetAllReward() ([]entity.Reward, error)
}

type rewardService struct {
	rewardRepo repository.RewardRepository
}

func NewRewardService(
	rewardRepo repository.RewardRepository,
) RewardService {
	return &rewardService{
		rewardRepo: rewardRepo,
	}
}

func (s *rewardService) GetAllReward() ([]entity.Reward, error) {
	return s.rewardRepo.GetAllReward()
}
