package services

import (
	"errors"
	"time"

	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/entity"
)

type PointTransactionService interface {
	// คง signature เดิมไว้ เพื่อไม่กระทบ controller เดิม
	CreatePointTransaction(memberID uint, pointRuleID uint, refIDs map[string]uint) (*entity.PointTransaction, error)
	GetPointTransactionByMemberID(memberID uint) ([]entity.PointTransaction, error)
}

type pointTransactionService struct {
	pointTransactionRepo   repository.PointTransactionRepository
	pointRuleRepository    repository.PointRuleRepository
	memberPointBalanceRepo repository.MemberPointBalanceRepository
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

// CreatePointTransaction: ใช้สำหรับ "ให้แต้ม" (EARN) ตาม PointRule
// refIDs: ใช้ส่งต้นเหตุ เช่น {"post_id": 10} หรือ {"poll_id": 5} หรือ {"review_id": 7}
func (s *pointTransactionService) CreatePointTransaction(
	memberID uint,
	pointRuleID uint,
	refIDs map[string]uint,
) (*entity.PointTransaction, error) {

	// 1) โหลด PointRule
	rule, err := s.pointRuleRepository.GetByID(pointRuleID)
	if err != nil || rule == nil {
		return nil, errors.New("point rule not found")
	}

	// 2) เช็ค DailyLimit (นับจำนวนรายการของ rule นี้ในวันนี้)
	today := time.Now().Format("2006-01-02")
	count, err := s.pointTransactionRepo.CountPointTransactionByRuleToday(memberID, pointRuleID, today)
	if err != nil {
		return nil, err
	}
	if rule.DailyLimit > 0 && count >= int64(rule.DailyLimit) {
		return nil, errors.New("daily limit reached")
	}

	// 3) ดึง balance ปัจจุบัน (ถ้าไม่มีก็จะสร้างใหม่ใน repo)
	balance, err := s.memberPointBalanceRepo.GetMemberPointBalanceByMemberID(memberID)
	if err != nil {
		return nil, err
	}

	// 4) เตรียม SourceType/SourceID จาก refIDs (เพื่อแทน PostID/PollID/ReviewID แบบเดิม)
	sourceType := "system"
	sourceID := uint(0)

	if refIDs != nil {
		if v := refIDs["post_id"]; v > 0 {
			sourceType, sourceID = "post", v
		} else if v := refIDs["poll_id"]; v > 0 {
			sourceType, sourceID = "poll", v
		} else if v := refIDs["review_id"]; v > 0 {
			sourceType, sourceID = "review", v
		}
	}

	// 5) สร้าง PointTransaction (EARN)
	ruleID := pointRuleID // ทำตัวแปรไว้เพื่อเอา address ได้
	after := balance.TotalPoint + rule.ActivityPoint

	tx := &entity.PointTransaction{
		MemberID:       memberID,
		PointRuleID:    &ruleID, // EARN มี rule
		PointChange:    rule.ActivityPoint,
		TxnType:        entity.PointTxnEarn,
		BalanceAfter:   after,
		SourceType:     sourceType,
		SourceID:       sourceID,
		IdempotencyKey: "", // ถ้ายังไม่ใช้ก็ปล่อยว่างได้
	}

	// 6) บันทึก transaction ก่อน
	if err := s.pointTransactionRepo.CreatePointTransaction(tx); err != nil {
		return nil, err
	}

	// 7) อัปเดตแต้มรวม (cache) ของสมาชิก
	if err := s.memberPointBalanceRepo.AddPointToMember(memberID, rule.ActivityPoint); err != nil {
		return nil, err
	}

	return tx, nil
}

func (s *pointTransactionService) GetPointTransactionByMemberID(memberID uint) ([]entity.PointTransaction, error) {
	return s.pointTransactionRepo.GetPointTransactionByMemberID(memberID)
}
