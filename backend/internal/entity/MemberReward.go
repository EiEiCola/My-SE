package entity

import (
	"errors"
	"strings"
	"time"

	"gorm.io/gorm"
)

type MemberReward struct {
	gorm.Model

	PointUsed   int       `json:"point_used"`
	RedeemedAt  time.Time `json:"redeemed_at" gorm:"not null"`

	// snapshot กัน reward เปลี่ยนทีหลัง
	RewardNameSnapshot    string `json:"reward_name_snapshot" gorm:"not null"`
	PointRequiredSnapshot int    `json:"point_required_snapshot" gorm:"not null"`

	MemberID uint   `json:"member_id"`
	Member   Member `gorm:"foreignKey:MemberID;references:ID"`

	RewardID uint   `json:"reward_id"`
	Reward   Reward `json:"reward" gorm:"foreignKey:RewardID;references:ID"`

	// trace ธุรกรรมที่ตัดแต้ม (สำคัญมากสำหรับ audit)
	PointTransactionID uint             `json:"point_transaction_id" gorm:"not null;index"`
	PointTransaction   PointTransaction `gorm:"foreignKey:PointTransactionID;references:ID"`

	// fields สำหรับ response (ไม่ลง DB)
	RewardName    string `json:"reward_name" gorm:"-"`
	RewardPicture string `json:"reward_picture" gorm:"-"`
	PointRequired int    `json:"point_required" gorm:"-"`
}

func ValidateMemberReward(mr MemberReward) (bool, error) {
	if mr.MemberID == 0 {
		return false, errors.New("MemberID is required")
	}

	if mr.RewardID == 0 {
		return false, errors.New("RewardID is required")
	}

	// point_used ต้อง > 0
	if mr.PointUsed <= 0 {
		return false, errors.New("PointUsed must be greater than 0")
	}

	// redeemed_at ต้องไม่เป็น zero time
	if mr.RedeemedAt.IsZero() {
		return false, errors.New("RedeemedAt is required")
	}

	// snapshot ต้องครบ (กัน reward เปลี่ยนทีหลัง)
	if strings.TrimSpace(mr.RewardNameSnapshot) == "" {
		return false, errors.New("RewardNameSnapshot is required")
	}

	if mr.PointRequiredSnapshot <= 0 {
		return false, errors.New("PointRequiredSnapshot must be greater than 0")
	}

	// ใช้แต้มต้องเท่ากับ required snapshot (กันกรณี client ส่งมั่ว)
	if mr.PointUsed != mr.PointRequiredSnapshot {
		return false, errors.New("PointUsed must equal PointRequiredSnapshot")
	}

	// ต้องมี transaction สำหรับ audit
	if mr.PointTransactionID == 0 {
		return false, errors.New("PointTransactionID is required")
	}

	return true, nil
}
