package entity

import (

	"gorm.io/gorm"
	"errors"
	"strings"
)
type ReviewVote struct {
	gorm.Model
	VoteType string `json:"vote_type" gorm:"type:varchar(20);not null"`
	//CreatedAt    time.Time `json:"created_at"`

	// ✅ 1 member โหวตได้แค่ 1 ครั้งต่อ 1 รีวิว (composite unique)
	// relation (เก็บไว้ join/preload ได้ แต่ไม่ส่งออก API)
	ReviewID uint    `json:"review_id" gorm:"not null;uniqueIndex:idx_review_vote_review_member"`
	Review *Review `json:"-" gorm:"foreignKey:ReviewID;references:ID"`

	MemberID uint    `json:"member_id" gorm:"not null;uniqueIndex:idx_review_vote_review_member"`
    Member *Member `json:"-" gorm:"foreignKey:MemberID;references:ID"`
}

const (
	VoteHelpful    = "helpful"
	VoteNotHelpful = "not_helpful"
)

func (v *ReviewVote) Validate() error {
	if v.ReviewID == 0 {
		return errors.New("review_id is required")
	}
	if v.MemberID == 0 {
		return errors.New("member_id is required")
	}

	vt := strings.ToLower(strings.TrimSpace(v.VoteType))
	if vt != VoteHelpful && vt != VoteNotHelpful {
		return errors.New("vote_type must be 'helpful' or 'not_helpful'")
	}

	return nil
}
