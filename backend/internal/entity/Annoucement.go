package entity

import "time"

type Announcement struct {
	ID             int        `gorm:"column:ann_ID;primaryKey;autoIncrement"`
	PRSubmissionID *int       `gorm:"column:pr_ID"` // NULL, FK -> PRSubmission.pr_ID
	Title          string     `gorm:"column:title"`
	Content        string     `gorm:"column:content"`
	CoverMediaID   int        `gorm:"column:cover_media_ID"` // FK -> AnnouncementMedia.media_ID
	PublishStartAt time.Time  `gorm:"column:publish_StartAt"`
	PublishEndAt   time.Time  `gorm:"column:publish_EndAt"`
	StatusID       int        `gorm:"column:Status"` // FK -> AnnouncementStatus.id
	CreatedAt      time.Time  `gorm:"column:CreatedAt"`
	UpdatedAt      time.Time  `gorm:"column:UpdatedAt"`
	PinPriority    int        `gorm:"column:pin_Priority"`

	PRSubmission *PRSubmission      `gorm:"foreignKey:PRSubmissionID;references:ID"`
	Status       AnnouncementStatus `gorm:"foreignKey:StatusID;references:ID"`
	Media        []AnnouncementMedia `gorm:"foreignKey:AnnouncementID;references:ID"`
}