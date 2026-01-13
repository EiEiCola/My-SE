package dataseed

import (
	"fmt"

	"gorm.io/gorm"

	"github.com/sut68/team12/backend/internal/entity"
)

// ---------- ensure seed point rule (used only for seed txn) ----------
func ensureSeedPointRule(db *gorm.DB, initial int) (uint, error) {
	const activityType = "SEED_INIT"

	var rule entity.PointRule
	err := db.Where("activity_type = ?", activityType).First(&rule).Error
	if err == nil {
		return rule.ID, nil
	}
	if err != gorm.ErrRecordNotFound {
		return 0, err
	}

	rule = entity.PointRule{
		ActivityType:  activityType,
		Description:   "Seed initial points for testing",
		ActivityPoint: initial,
		DailyLimit:    0,
	}

	if ok, vErr := entity.ValidatePointRule(rule); !ok {
		return 0, vErr
	}

	if err := db.Create(&rule).Error; err != nil {
		return 0, err
	}

	return rule.ID, nil
}

// ---------- SAFE seed: create balance ONLY if not exists ----------
func SeedInitialPointsSafe(db *gorm.DB, initial int) error {
	return nil
	seedRuleID, err := ensureSeedPointRule(db, initial)
	if err != nil {
		return err
	}

	var members []entity.Member
	if err := db.Find(&members).Error; err != nil {
		return err
	}

	for _, m := range members {
		memberID := m.ID

		err := db.Transaction(func(tx *gorm.DB) error {
			// 1) ถ้ามี balance อยู่แล้ว -> ไม่แตะ (ปลอดภัยสุด)
			var bal entity.MemberPointBalance
			err := tx.Where("member_id = ?", memberID).First(&bal).Error

			if err == nil {
				// มี balance แล้ว แปลว่าเริ่มใช้ระบบแต้มแล้ว/ถูกสร้างไว้แล้ว
				// ไม่ทำอะไรต่อ (กันทับแต้มจริงในอนาคต)
				return nil
			}

			if err != gorm.ErrRecordNotFound {
				return err
			}

			// 2) ยังไม่มี balance -> สร้างใหม่ initial
			bal = entity.MemberPointBalance{
				MemberID:   memberID,
				TotalPoint: initial,
			}
			if ok, vErr := entity.ValidateMemberPointBalance(bal); !ok {
				return vErr
			}
			if err := tx.Create(&bal).Error; err != nil {
				return err
			}

			// 3) สร้าง seed transaction (idempotent)
			idemKey := fmt.Sprintf("seed:init:%d", memberID)

			var count int64
			if err := tx.Model(&entity.PointTransaction{}).
				Where("idempotency_key = ?", idemKey).
				Count(&count).Error; err != nil {
				return err
			}
			if count > 0 {
				return nil
			}

			pt := entity.PointTransaction{
				MemberID:       memberID,
				PointRuleID:    &seedRuleID,
				PointChange:    initial, // EARN ต้อง > 0
				TxnType:        entity.PointTxnEarn,
				BalanceAfter:   initial,
				SourceType:     "SEED",
				SourceID:       1,
				IdempotencyKey: idemKey,
			}

			if ok, vErr := entity.ValidatePointTransaction(pt); !ok {
				return vErr
			}

			return tx.Create(&pt).Error
		})

		if err != nil {
			return err
		}
	}

	return nil
}
