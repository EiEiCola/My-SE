package entity

import "time"

type AnnouncementRead struct {
	ID             uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	MemberID       uint      `gorm:"index" json:"member_id"`
	AnnouncementID int       `gorm:"index" json:"announcement_id"`
	ReadAt         time.Time `json:"read_at"`

	Member       Member       `gorm:"foreignKey:MemberID" json:"member,omitempty"`
	Announcement Announcement `gorm:"foreignKey:AnnouncementID" json:"announcement,omitempty"`
}
