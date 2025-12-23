package services

import (
	"errors"
	"time"

	"github.com/sut68/team12/backend/internal/dto"
	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/entity"
	"gorm.io/gorm"
)

type MemberRewardService interface {
	Redeem(memberID uint, rewardID uint, idempotencyKey string) (newBalance int, memberRewardID uint, err error)

	// ✅ เปลี่ยน return type เป็น DTO
	MyStickers(memberID uint) ([]dto.MyStickerDTO, error)

	MyPoints(memberID uint) (int, error)
}

type memberRewardService struct {
	db   *gorm.DB
	repo repository.MemberRewardRepository
}

func NewMemberRewardService(db *gorm.DB, r repository.MemberRewardRepository) MemberRewardService {
	return &memberRewardService{db: db, repo: r}
}

func (s *memberRewardService) Redeem(memberID uint, rewardID uint, idempotencyKey string) (int, uint, error) {
	if memberID == 0 || rewardID == 0 {
		return 0, 0, errors.New("invalid member_id or reward_id")
	}

	var newBalance int
	var memberRewardID uint

	err := s.db.Transaction(func(tx *gorm.DB) error {
		r := repository.NewMemberRewardRepository(tx)

		if idempotencyKey != "" {
			var count int64
			if err := tx.Model(&entity.PointTransaction{}).
				Where("member_id = ? AND idempotency_key = ?", memberID, idempotencyKey).
				Count(&count).Error; err != nil {
				return err
			}
			if count > 0 {
				return errors.New("duplicate request")
			}
		}

		reward, err := r.GetRewardByID(rewardID)
		if err != nil {
			return err
		}

		bal, err := r.GetOrCreateBalance(memberID)
		if err != nil {
			return err
		}

		if bal.TotalPoint < reward.PointRequired {
			return errors.New("point not enough")
		}

		newBalance = bal.TotalPoint - reward.PointRequired

		if err := r.UpdateBalance(memberID, newBalance); err != nil {
			return err
		}

		txn := &entity.PointTransaction{
			MemberID:       memberID,
			PointRuleID:    nil,
			PointChange:    -reward.PointRequired,
			TxnType:        entity.PointTxnSpend,
			BalanceAfter:   newBalance,
			SourceType:     "redeem",
			SourceID:       0,
			IdempotencyKey: idempotencyKey,
		}
		if err := r.CreatePointTransaction(txn); err != nil {
			return err
		}

		mr := &entity.MemberReward{
			PointUsed:             reward.PointRequired,
			RedeemedAt:            time.Now(),
			RewardNameSnapshot:    reward.RewardName,
			PointRequiredSnapshot: reward.PointRequired,
			MemberID:              memberID,
			RewardID:              reward.ID,
			PointTransactionID:    txn.ID,
		}
		if err := r.CreateMemberReward(mr); err != nil {
			return err
		}

		memberRewardID = mr.ID

		if err := tx.Model(&entity.PointTransaction{}).
			Where("id = ?", txn.ID).
			Update("source_id", mr.ID).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return 0, 0, err
	}
	return newBalance, memberRewardID, nil
}

// ✅ คืน DTO
func (s *memberRewardService) MyStickers(memberID uint) ([]dto.MyStickerDTO, error) {
	return s.repo.GetMyStickers(memberID)
}

func (s *memberRewardService) MyPoints(memberID uint) (int, error) {
	return s.repo.GetBalance(memberID)
}
