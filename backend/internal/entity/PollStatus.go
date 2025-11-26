package entity

import (
	

	"gorm.io/gorm"
)

type PollStatus struct {
	gorm.Model
	Name  string `json:"name"`  // ชื่อสถานะ DRAFT, PENDING_REVIEW, APPROVED, REJECTED, PUBLISHED, CLOSED
	
	Polls []Poll `gorm:"foreignKey:PollStatusID;references:ID" json:"polls"`
}