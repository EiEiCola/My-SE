package entity

import (
	"errors"
	"strings"

	"gorm.io/gorm"
)

// ประเภทของธุรกรรมแต้ม
// EARN  = ได้แต้มจากกิจกรรม
// SPEND = ใช้แต้มแลกรางวัล
type PointTransactionType string

const (
	PointTxnEarn  PointTransactionType = "EARN"
	PointTxnSpend PointTransactionType = "SPEND"
)

type PointTransaction struct {
	gorm.Model

	MemberID uint   `json:"member_id" gorm:"not null;index"`
	Member   Member `gorm:"foreignKey:MemberID;references:ID"`

	// ใช้เฉพาะ EARN
	PointRuleID *uint      `json:"point_rule_id" gorm:"index"`
	PointRule   *PointRule `gorm:"foreignKey:PointRuleID;references:ID"`

	// + = ได้แต้ม, - = ใช้แต้ม
	PointChange int `json:"point_change" gorm:"not null"`

	// EARN / SPEND เท่านั้น
	TxnType PointTransactionType `json:"txn_type" gorm:"type:varchar(16);not null"`

	BalanceAfter int `json:"balance_after" gorm:"not null;default:0"`

	SourceType string `json:"source_type" gorm:"type:varchar(32);not null;index"`
	SourceID   uint   `json:"source_id" gorm:"not null;index"`

	IdempotencyKey string `json:"idempotency_key" gorm:"type:varchar(64);index"`
}

func ValidatePointTransaction(tx PointTransaction) (bool, error) {
	// Member
	if tx.MemberID == 0 {
		return false, errors.New("MemberID is required")
	}

	// TxnType
	switch tx.TxnType {
	case PointTxnEarn, PointTxnSpend:
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

	// Rules
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
	}

	return true, nil
}
