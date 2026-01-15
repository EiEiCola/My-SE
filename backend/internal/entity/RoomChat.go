package entity

import (
	"time"
)

type RoomChat struct {
	ID        uint      `gorm:"column:room_id;primaryKey;autoIncrement" json:"room_id"`
	Type      string    `json:"rc_type"` // "private" หรือ "group"
	Name      string    `json:"rc_name"`
	AvatarURL string    `json:"rc_url"`
	CreatedBy int       `json:"created_by"` // FK -> Member.ID
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// ความสัมพันธ์
	Member   []RoomMember `gorm:"foreignKey:RoomID;references:ID" json:"member"`
	Messages []Message    `gorm:"foreignKey:RoomID;references:ID" json:"message"`

	// Fields for API Response (Computed)
	LastMessage    string `gorm:"-" json:"last_message"`
	LastSenderID   uint   `gorm:"-" json:"last_sender_id"`
	LastSenderName string `gorm:"-" json:"last_sender_name"`
	UnreadCount    int    `gorm:"-" json:"unread_count"`
}
