package entity

import (
	"time"
	"gorm.io/gorm"
	"errors"
	"strings"
)
type ReviewVote struct {
	gorm.Model
	VoteType     string    `json:"vote_type"`
	CreatedAt    time.Time `json:"created_at"`
	ReviewID uint  `json:"review_id"`
	Review   Review  `gorm:"foreignKey:ReviewID;references:ID" json:"review"`

	MemberID   uint   `json:"member_id"`  
    Member     Member `gorm:"foreignKey:MemberID;references:ID"`
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
