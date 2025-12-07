package services

import (
	"errors"
	"time"

	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/entity"
)

type PointTransactionService interface {
	CreatePointTransaction(memberID uint, pointRuleID uint, refIDs map[string]uint) (*entity.PointTransaction, error)
	GetPointTransactionByMemberID(memberID uint) ([]entity.PointTransaction, error)
}

type pointTransactionService struct {
	pointTransactionRepo     repository.PointTransactionRepository
	pointRuleRepository      repository.PointRuleRepository
	memberPointBalanceRepo   repository.MemberPointBalanceRepository
}

func NewPointTransactionService(
	ptRepo repository.PointTransactionRepository,
	ruleRepo repository.PointRuleRepository,
	mpbRepo repository.MemberPointBalanceRepository,
) PointTransactionService {
	return &pointTransactionService{
		pointTransactionRepo:   ptRepo,
		pointRuleRepository:    ruleRepo,
		memberPointBalanceRepo: mpbRepo,
	}
}

func (s *pointTransactionService) CreatePointTransaction(memberID uint, pointRuleID uint, refIDs map[string]uint) (*entity.PointTransaction, error) {
	// โหลด PointRule
	rule, err := s.pointRuleRepository.GetByID(pointRuleID)
	if err != nil {
		return nil, errors.New("point rule not found")
	}

	// เช็ค DailyLimit
	today := time.Now().Format("2006-01-02")
	count, err := s.pointTransactionRepo.CountPointTransactionByRuleToday(memberID, pointRuleID, today)
	if err != nil {
		return nil, err
	}
	if rule.DailyLimit > 0 && count >= int64(rule.DailyLimit) {
		return nil, errors.New("daily limit reached")
	}

	// สร้าง PointTransaction
	tx := &entity.PointTransaction{
		Point:       rule.ActivityPoint,
		MemberID:    memberID,
		PointRuleID: pointRuleID,
		PostID:      refIDs["post_id"],
		PollID:      refIDs["poll_id"],
		ReviewID:    refIDs["review_id"],
	}

	if err := s.pointTransactionRepo.CreatePointTransaction(tx); err != nil {
		return nil, err
	}

	// อัปเดตแต้ม
	if err := s.memberPointBalanceRepo.AddPointToMember(memberID, rule.ActivityPoint); err != nil {
		return nil, err
	}

	return tx, nil
}

func (s *pointTransactionService) GetPointTransactionByMemberID(memberID uint) ([]entity.PointTransaction, error) {
	return s.pointTransactionRepo.GetPointTransactionByMemberID(memberID)
}
