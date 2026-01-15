package entity

import (
	"time"
)

type MessageStatus struct {
	ID          uint       `gorm:"primaryKey;autoIncrement" json:"id"`
	MessageID   uint       `gorm:"column:message_id" json:"message_id"`
	Message     Message    `gorm:"foreignKey:MessageID" json:"message"`
	RecipientID uint       `gorm:"column:recipient_id" json:"recipient_id"` // ผู้รับ (Changed from UserID to force migration fix)
	User        Member     `gorm:"foreignKey:RecipientID" json:"user"`
	Status      string     `gorm:"type:varchar(20);default:'unread'" json:"status"` // 'unread', 'read'
	ReadAt      *time.Time `gorm:"column:read_at" json:"read_at"`
	CreatedAt   time.Time  `json:"created_at"`
}
