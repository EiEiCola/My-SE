package entity

import (
	"time"
)

type MessageStatus struct {
    MessageID uint      `gorm:"primaryKey" json:"message_id"`
    MemberID  uint      `gorm:"primaryKey" json:"member_id"` // คนที่อ่าน
    Status    string    `json:"status"` // "read"
    ReadAt    time.Time `json:"read_at"`

	// ความสัมพันธ์
    Message Message `gorm:"foreignKey:MessageID;references:ID" json:"message,omitempty"`
    Member  Member  `gorm:"foreignKey:MemberID;references:ID" json:"member,omitempty"`
}
