package entity

import (
	"time"
)

type Message struct {
	ID       uint `gorm:"primaryKey;autoIncrement" json:"message_id"`
	RoomID   uint `gorm:"index" json:"room_id"`   // FK -> RoomChat.ID
	SenderID uint `gorm:"index" json:"sender_id"` // FK -> Member.ID

	Content string    `json:"content"`
	Type    string    `json:"typeMessage"` //text, image, file, sticker
	SentAt  time.Time `json:"sentMessage_at"`

	// ความสัมพันธ์
	AttachmentsChat []AttachmentChat `gorm:"foreignKey:MessageID;references:ID" json:"attachment_chat,omitempty"`
	Statuses        []MessageStatus  `gorm:"foreignKey:MessageID;references:ID" json:"message_status,omitempty"`

	Room   RoomChat `gorm:"foreignKey:RoomID;references:ID" json:"room,omitempty"`
	Sender Member   `gorm:"foreignKey:SenderID;references:ID" json:"sender,omitempty"`
}
