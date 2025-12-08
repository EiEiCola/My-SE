package services

import (
	
	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/entity"
)

type MemberPointBalanceService interface {
	GetMemberPointBalanceByMemberID(memberID uint) (*entity.MemberPointBalance, error)
}

type memberPointBalanceService struct {
	memberPointBalanceRepo repository.MemberPointBalanceRepository
}

func NewMemberPointBalanceService(
	memberPointBalanceRepo repository.MemberPointBalanceRepository,
) MemberPointBalanceService {
	return &memberPointBalanceService{
		memberPointBalanceRepo: memberPointBalanceRepo,
	}
}

func (s *memberPointBalanceService) GetMemberPointBalanceByMemberID(memberID uint) (*entity.MemberPointBalance, error) {
	return s.memberPointBalanceRepo.GetMemberPointBalanceByMemberID(memberID)
}
