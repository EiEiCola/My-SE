package entity

import (
	"errors"
	"strings"

	"gorm.io/gorm"
)

// ประเภทของธุรกรรมแต้ม
// EARN   = ได้แต้ม (โพสต์ / โพล / รีวิว ฯลฯ)
// SPEND  = ใช้แต้ม (แลกรางวัล)
// ADJUST = ปรับแต้มโดยแอดมิน (แก้ไข / ชดเชย)
type PointTransactionType string

const (
	PointTxnEarn   PointTransactionType = "EARN"
	PointTxnSpend  PointTransactionType = "SPEND"
	PointTxnAdjust PointTransactionType = "ADJUST"
)

type PointTransaction struct {
	gorm.Model

	MemberID uint   `json:"member_id" gorm:"not null;index"`
	Member   Member `gorm:"foreignKey:MemberID;references:ID"`

	// กติกาที่ใช้ให้แต้ม (มีเฉพาะตอน EARN)
	// - ถ้าเป็น SPEND (แลกรางวัล) จะเป็น nil
	PointRuleID *uint      `json:"point_rule_id" gorm:"index"`
	PointRule   *PointRule `gorm:"foreignKey:PointRuleID;references:ID"`

	// จำนวนแต้มที่เปลี่ยนในครั้งนี้
	// - ค่าบวก  = ได้แต้ม
	// - ค่าลบ   = ใช้แต้ม
	PointChange int `json:"point_change" gorm:"not null"`

	// ประเภทของธุรกรรม
	// - EARN / SPEND / ADJUST
	TxnType PointTransactionType `json:"txn_type" gorm:"type:varchar(16);not null"`

	// ยอดแต้มคงเหลือหลังจากทำรายการนี้เสร็จ
	BalanceAfter int `json:"balance_after" gorm:"not null;default:0"`

	// แหล่งที่มาของการเปลี่ยนแต้ม
	// ตัวอย่าง:
	// - post   + SourceID = Post.ID
	// - poll   + SourceID = Poll.ID
	// - review + SourceID = Review.ID
	// - redeem + SourceID = MemberReward.ID
	// ------------------------------------------------
	SourceType string `json:"source_type" gorm:"type:varchar(32);not null;default:'system';index"`
	SourceID   uint   `json:"source_id" gorm:"not null;default:0;index"`

	// key สำหรับกันการยิงซ้ำ (double submit)
	IdempotencyKey string `json:"idempotency_key" gorm:"type:varchar(64);index"`
}

// ValidatePointTransaction validates PointTransaction business rules (entity-level only).
// NOTE: daily_limit / idempotency duplicate check usually belongs to service/repo (needs DB).
func ValidatePointTransaction(tx PointTransaction) (bool, error) {
	// Member
	if tx.MemberID == 0 {
		return false, errors.New("MemberID is required")
	}

	// TxnType must be valid
	switch tx.TxnType {
	case PointTxnEarn, PointTxnSpend, PointTxnAdjust:
		// ok
	default:
		return false, errors.New("TxnType is invalid")
	}

	// Source
	if strings.TrimSpace(tx.SourceType) == "" {
		return false, errors.New("SourceType is required")
	}
	if tx.SourceID == 0 {
		return false, errors.New("SourceID is required")
	}

	// PointChange rules by type
	switch tx.TxnType {
	case PointTxnEarn:
		if tx.PointRuleID == nil || *tx.PointRuleID == 0 {
			return false, errors.New("PointRuleID is required for EARN")
		}
		if tx.PointChange <= 0 {
			return false, errors.New("PointChange must be greater than 0 for EARN")
		}

	case PointTxnSpend:
		if tx.PointRuleID != nil {
			return false, errors.New("PointRuleID must be nil for SPEND")
		}
		if tx.PointChange >= 0 {
			return false, errors.New("PointChange must be less than 0 for SPEND")
		}

	case PointTxnAdjust:
		// adjust อนุญาต + หรือ - ได้ แต่ห้าม 0
		if tx.PointChange == 0 {
			return false, errors.New("PointChange must not be 0 for ADJUST")
		}
	}

	return true, nil
}
