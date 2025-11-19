package entity

import (
	"time"
	"gorm.io/gorm"
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
