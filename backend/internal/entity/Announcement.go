package entity

import "time"

type Announcement struct {
	ID             int       `gorm:"column:ann_id;primaryKey;autoIncrement" json:"id"`
	PRSubmissionID *int      `gorm:"column:pr_id" json:"pr_submission_id,omitempty"`
	Title          string    `gorm:"column:title" json:"title"`
	Content        string    `gorm:"column:content" json:"content"`
	CoverMediaID   int       `gorm:"column:cover_media_id" json:"cover_media_id"`
	PublishStartAt time.Time `gorm:"column:publish_start_at" json:"publish_start_at"`
	PublishEndAt   time.Time `gorm:"column:publish_end_at" json:"publish_end_at"`
	StatusID       int       `gorm:"column:status" json:"status_id"`
	CreatedAt      time.Time `gorm:"column:created_at" json:"created_at"`
	UpdatedAt      time.Time `gorm:"column:updated_at" json:"updated_at"`
	PinPriority    int       `gorm:"column:pin_priority" json:"pin_priority"`
	AdminID        *uint     `gorm:"column:admin_id" json:"admin_id,omitempty"`

	PRSubmission *PRSubmission       `gorm:"foreignKey:PRSubmissionID;references:ID;constraint:false" json:"pr_submission,omitempty"`
	Admin        *Admin              `gorm:"foreignKey:AdminID;references:ID;constraint:false" json:"admin,omitempty"`
	Status       AnnouncementStatus  `gorm:"foreignKey:StatusID;references:ID;constraint:false" json:"status,omitempty"`
	Media        []AnnouncementMedia `gorm:"foreignKey:AnnouncementID;references:ID;constraint:false" json:"media,omitempty"`

	// Polymorphic relation for Reports
	Reports []Report `gorm:"polymorphic:Target;" json:"reports"`
}
