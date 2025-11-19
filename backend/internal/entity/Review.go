package entity

import (
	"gorm.io/gorm"
	"time"
)
type Review struct {
	gorm.Model
	Title           string    `json:"title"`
	Content         string    `json:"content"`
	Rating          int       `json:"rating"`
	IsAnonymous     bool      `json:"is_anonymous"`
	HelpfulCount    int       `json:"helpful_count"`
	NotHelpfulCount int       `json:"not_helpful_count"`
	CreatedAt       time.Time `json:"created_at"`

	MemberID   uint   `json:"member_id"`  
    Member     Member `gorm:"foreignKey:MemberID;references:ID"`

	//FK category


	ReviewImages []ReviewImage `gorm:"foreignKey:ReviewID;references:ID"`
	ReviewVotes  []ReviewVote  `gorm:"foreignKey:ReviewID;references:ID"`

	Tags        []Tag        `gorm:"many2many:review_tags" json:"tags"`
    ReviewTags  []ReviewTag  `gorm:"foreignKey:ReviewID"`

}

