package entity

import (
	"time"
)

type Message struct {
	ID       uint `gorm:"primaryKey;autoIncrement" json:"message_id"`
	RoomID   uint `gorm:"index" json:"room_id"`
	SenderID uint `gorm:"index" json:"sender_id"`

	Content string `json:"content"`
	Type    string `json:"type_message"` // text, image, file, sticker

	StickerID *uint `gorm:"index" json:"sticker_id"`

	SentAt    time.Time `json:"sent_at"`
	IsDeleted bool      `json:"is_deleted"`

	// Relations
	AttachmentsChat []AttachmentChat `gorm:"foreignKey:MessageID;references:ID" json:"attachments,omitempty"`
	Room            RoomChat         `gorm:"foreignKey:RoomID;references:ID" json:"room,omitempty"`
	Sender          Member           `gorm:"foreignKey:SenderID;references:ID" json:"sender,omitempty"`
	Sticker         *Reward          `gorm:"foreignKey:StickerID;references:ID" json:"sticker,omitempty"`
}
