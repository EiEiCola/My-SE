package services

import (
	"errors"

	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/entity"
)

type MemberRewardService interface {
	RedeemMemberReward(memberID uint, rewardID uint) (*entity.MemberReward, error)
	GetMemberRewardByMemberID(memberID uint) ([]entity.MemberReward, error)
}

type memberRewardService struct {
	memberRewardRepo       repository.MemberRewardRepository
	rewardRepo             repository.RewardRepository
	memberPointBalanceRepo repository.MemberPointBalanceRepository
}

func NewMemberRewardService(
	mrRepo repository.MemberRewardRepository,
	rRepo repository.RewardRepository,
	mpbRepo repository.MemberPointBalanceRepository,
) MemberRewardService {
	return &memberRewardService{
		memberRewardRepo:       mrRepo,
		rewardRepo:             rRepo,
		memberPointBalanceRepo: mpbRepo,
	}
}

func (s *memberRewardService) RedeemMemberReward(memberID uint, rewardID uint) (*entity.MemberReward, error) {
	reward, err := s.rewardRepo.GetRewardByID(rewardID)
	if err != nil {
		return nil, errors.New("reward not found")
	}

	balance, err := s.memberPointBalanceRepo.GetMemberPointBalanceByMemberID(memberID)
	if err != nil {
		return nil, err
	}

	if balance.TotalPoint < reward.PointRequired {
		return nil, errors.New("not enough points")
	}

	mr := &entity.MemberReward{
		MemberID:  memberID,
		RewardID:  rewardID,
		PointUsed: reward.PointRequired,
	}

	if err := s.memberRewardRepo.CreateMemberReward(mr); err != nil {
		return nil, err
	}

	if err := s.memberPointBalanceRepo.DeductPointFromMember(memberID, reward.PointRequired); err != nil {
		return nil, err
	}

	return mr, nil
}

func (s *memberRewardService) GetMemberRewardByMemberID(memberID uint) ([]entity.MemberReward, error) {
	return s.memberRewardRepo.GetMemberRewardByMemberID(memberID)
}
