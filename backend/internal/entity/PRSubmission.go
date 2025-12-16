package entity

import "time"

type PRSubmission struct {
	ID           int       `gorm:"column:pr_id;primaryKey;autoIncrement" json:"id"`
	MemberID     uint      `gorm:"column:m_id" json:"member_id"`
	Title        string    `gorm:"column:pr_title" json:"title"`
	Content      string    `gorm:"column:pr_content" json:"content"`
	ReqStartAt   time.Time `gorm:"column:req_start_at" json:"req_start_at"`
	ReqEndAt     time.Time `gorm:"column:req_end_at" json:"req_end_at"`
	StatusID     int       `gorm:"column:status" json:"status_id"`
	RejectReason string    `gorm:"column:reject_reason" json:"reject_reason"`

	Member Member             `gorm:"foreignKey:MemberID;references:ID;constraint:false" json:"member"`
	Status PRSubmissionStatus `gorm:"foreignKey:StatusID;references:ID;constraint:false" json:"status"`

	Media   []PRSubmissionMedia `gorm:"foreignKey:PRID;references:ID;constraint:false" json:"media"`
	Reviews []PRReview          `gorm:"foreignKey:PRID;references:ID;constraint:false" json:"reviews"`

	Announcement *Announcement `gorm:"foreignKey:PRSubmissionID;references:ID;constraint:false" json:"announcement"`

	// Polymorphic relation for Reports
	Reports []Report `gorm:"polymorphic:Target;" json:"reports"`
}
