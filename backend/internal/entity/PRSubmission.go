package entity

import "time"

type PRSubmission struct {
	ID           int       `gorm:"column:pr_id;primaryKey;autoIncrement"`
	MemberID     uint      `gorm:"column:m_id"`
	Title        string    `gorm:"column:pr_title"`
	Content      string    `gorm:"column:pr_content"`
	ReqStartAt   time.Time `gorm:"column:req_start_at"`
	ReqEndAt     time.Time `gorm:"column:req_end_at"`
	StatusID     int       `gorm:"column:status"`
	RejectReason string    `gorm:"column:reject_reason"`

	Member Member             `gorm:"foreignKey:MemberID;references:ID;constraint:false"`
	Status PRSubmissionStatus `gorm:"foreignKey:StatusID;references:ID;constraint:false"`

	Media   []PRSubmissionMedia `gorm:"foreignKey:PRID;references:ID;constraint:false"`
	Reviews []PRReview          `gorm:"foreignKey:PRID;references:ID;constraint:false"`

	Announcement *Announcement `gorm:"foreignKey:PRSubmissionID;references:ID;constraint:false"`

	// Polymorphic relation for Reports
	Reports []Report `gorm:"polymorphic:Target;" json:"reports"`
}
