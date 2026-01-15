package services

import (
	"errors"
	"time"

	"github.com/sut68/team12/backend/internal/entity"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var (
	ErrDailyLimitReached = errors.New("daily_limit_reached")
	ErrDuplicateEarn     = errors.New("duplicate_earn")
	ErrPointRuleNotFound = errors.New("point_rule_not_found")
	ErrMemberNotFound    = errors.New("member_profile_not_found")
)

type PointService interface {
	EarnPoints(
		memberID uint, // ✅ ProfileID
		activityType string,
		sourceType string,
		sourceID uint,
		idempotencyKey string,
	) error
}

type pointService struct {
	db *gorm.DB
}

func NewPointService(db *gorm.DB) PointService {
	return &pointService{db: db}
}

func todayRange() (time.Time, time.Time, error) {
	loc, err := time.LoadLocation("Asia/Bangkok")
	if err != nil {
		return time.Time{}, time.Time{}, err
	}
	now := time.Now().In(loc)
	start := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)
	end := start.Add(24 * time.Hour)
	return start, end, nil
}

func (s *pointService) EarnPoints(
	memberID uint, // ✅ รับ ProfileID โดยตรง (Controller resolved มาแล้ว)
	activityType string,
	sourceType string,
	sourceID uint,
	idempotencyKey string,
) error {

	return s.db.Transaction(func(tx *gorm.DB) error {
		// ✅ ไม่ต้อง lookup แล้ว เพราะ input คือ ProfileID
		// ----------------------------------------------

		// 1) load rule
		var rule entity.PointRule
		if err := tx.Where("activity_type = ?", activityType).
			First(&rule).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrPointRuleNotFound
			}
			return err
		}

		// 2) กันซ้ำ (Check Duplication)
		// ถ้ามี IdempotencyKey ให้เช็คด้วย Key เป็นหลัก (caller กำหนดความ Unique เอง)
		if idempotencyKey != "" {
			var dupKey entity.PointTransaction
			if err := tx.Where("idempotency_key = ?", idempotencyKey).First(&dupKey).Error; err == nil {
				return ErrDuplicateEarn // หรือ return nil ถ้าอยากให้ Idempotent แบบเงียบๆ
			} else if !errors.Is(err, gorm.ErrRecordNotFound) {
				return err
			}
		} else {
			// fallback: เช็คด้วย source_type + source_id (แบบเดิม)
			var dup entity.PointTransaction
			err := tx.Where("member_id = ? AND txn_type = ? AND source_type = ? AND source_id = ?",
				memberID, entity.PointTxnEarn, sourceType, sourceID).
				First(&dup).Error

			if err == nil {
				return ErrDuplicateEarn
			} else if !errors.Is(err, gorm.ErrRecordNotFound) {
				return err
			}
		}

		// 3) daily limit
		if rule.DailyLimit > 0 {
			start, end, _ := todayRange()
			var cnt int64
			if err := tx.Model(&entity.PointTransaction{}).
				Where(`
                    member_id = ? AND txn_type = ? AND point_rule_id = ?
                    AND created_at >= ? AND created_at < ?
                `, memberID, entity.PointTxnEarn, rule.ID, start, end).
				Count(&cnt).Error; err != nil {
				return err
			}

			if int(cnt) >= rule.DailyLimit {
				return ErrDailyLimitReached
			}
		}

		// 4) lock balance
		var bal entity.MemberPointBalance
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("member_id = ?", memberID).
			First(&bal).Error; err != nil {

			if errors.Is(err, gorm.ErrRecordNotFound) {
				bal = entity.MemberPointBalance{
					MemberID:   memberID,
					TotalPoint: 0,
				}
				if err := tx.Create(&bal).Error; err != nil {
					return err
				}
			} else {
				return err
			}
		}

		newBalance := bal.TotalPoint + rule.ActivityPoint

		// 5) create transaction
		ruleID := rule.ID
		txn := entity.PointTransaction{
			MemberID:       memberID,
			PointRuleID:    &ruleID,
			PointChange:    rule.ActivityPoint,
			TxnType:        entity.PointTxnEarn,
			BalanceAfter:   newBalance,
			SourceType:     sourceType,
			SourceID:       sourceID,
			IdempotencyKey: idempotencyKey,
		}

		if err := tx.Create(&txn).Error; err != nil {
			return err
		}

		// 6) update balance
		if err := tx.Model(&entity.MemberPointBalance{}).
			Where("id = ?", bal.ID).
			Update("total_point", newBalance).Error; err != nil {
			return err
		}

		return nil
	})
}