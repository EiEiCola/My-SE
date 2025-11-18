package entity

import "time"

type Announcement struct {
	ID             int       `gorm:"column:ann_ID;primaryKey;autoIncrement" json:"id"`
	PRSubmissionID *int      `gorm:"column:pr_ID" json:"pr_submission_id,omitempty"` // NULL, FK -> PRSubmission.pr_ID
	Title          string    `gorm:"column:title" json:"title"`
	Content        string    `gorm:"column:content" json:"content"`
	CoverMediaID   int       `gorm:"column:cover_media_ID" json:"cover_media_id"` // FK -> AnnouncementMedia.media_ID
	PublishStartAt time.Time `gorm:"column:publish_StartAt" json:"publish_start_at"`
	PublishEndAt   time.Time `gorm:"column:publish_EndAt" json:"publish_end_at"`
	StatusID       int       `gorm:"column:Status" json:"status_id"` // FK -> AnnouncementStatus.id
	CreatedAt      time.Time `gorm:"column:CreatedAt" json:"created_at"`
	UpdatedAt      time.Time `gorm:"column:UpdatedAt" json:"updated_at"`
	PinPriority    int       `gorm:"column:pin_Priority" json:"pin_priority"`

	PRSubmission *PRSubmission       `gorm:"foreignKey:PRSubmissionID;references:ID" json:"pr_submission,omitempty"`
	Status       AnnouncementStatus  `gorm:"foreignKey:StatusID;references:ID" json:"status,omitempty"`
	Media        []AnnouncementMedia `gorm:"foreignKey:AnnouncementID;references:ID" json:"media,omitempty"`
}
