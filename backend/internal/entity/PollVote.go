package entity

import (
	"time"

	"gorm.io/gorm"
)

type PollVote struct {
	gorm.Model

	// โหวตของโพลไหน + ตัวเลือกไหน
	PollID uint `gorm:"uniqueIndex:idx_poll_member_vote" json:"poll_id"`
	Poll   Poll `gorm:"foreignKey:PollID;references:ID" json:"poll"`

	PollOptionID uint       `json:"poll_option_id"`
	PollOption   PollOption `gorm:"foreignKey:PollOptionID;references:ID" json:"option"`

	// ใครเป็นคนโหวต
	// ⚠️ uniqueIndex ป้องกันไม่ให้คนเดียวโหวตซ้ำในโพลเดียวกัน
	MemberID uint   `gorm:"uniqueIndex:idx_poll_member_vote" json:"member_id"`
	Member   Member `gorm:"foreignKey:MemberID;references:ID" json:"member"`

	// เวลาโหวต (ใช้ gorm.Model.CreatedAt ก็ได้ แต่เก็บแยกก็ชัดดี)
	VotedAt time.Time `json:"voted_at"`
}
