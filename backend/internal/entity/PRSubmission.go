package entity

import "time"

type PRSubmission struct {
	ID           int       `gorm:"column:pr_ID;primaryKey;autoIncrement"`
	MemberID     string    `gorm:"column:m_ID"` // ให้ตรง type กับ Member.ID
	Title        string    `gorm:"column:pr_title"`
	Content      string    `gorm:"column:pr_content"`
	ReqStartAt   time.Time `gorm:"column:req_StartAt"`
	ReqEndAt     time.Time `gorm:"column:req_EndAt"`
	StatusID     int       `gorm:"column:Status"`      // FK -> PRSubmissionStatus.id
	RejectReason string    `gorm:"column:RejectReason"`

	Member Member             `gorm:"foreignKey:MemberID;references:ID"`
	Status PRSubmissionStatus `gorm:"foreignKey:StatusID;references:ID"`

	Media   []PRSubmissionMedia `gorm:"foreignKey:PRID;references:ID"`
	Reviews []PRReview          `gorm:"foreignKey:PRID;references:ID"`

	Announcement *Announcement `gorm:"foreignKey:PRSubmissionID;references:ID"`
}