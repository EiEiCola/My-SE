package entity

import "gorm.io/gorm"

// ตารางกลาง: 1 PollVote (1 คน 1 โพล 1 ครั้ง) เลือกได้หลาย PollOption
type PollVoteOption struct {
	gorm.Model

	PollVoteID uint     `gorm:"not null;index;uniqueIndex:idx_vote_option_unique" json:"poll_vote_id"`
	PollVote   PollVote `gorm:"foreignKey:PollVoteID;references:ID" json:"poll_vote"`

	PollOptionID uint       `gorm:"not null;index;uniqueIndex:idx_vote_option_unique" json:"poll_option_id"`
	PollOption   PollOption `gorm:"foreignKey:PollOptionID;references:ID" json:"poll_option"`
}
