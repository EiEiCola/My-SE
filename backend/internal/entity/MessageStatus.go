package entity

import (
	"time"
)

type MessageStatus struct {
    MessageID     uint       `gorm:"primaryKey" json:"message_id"`	// FK -> Message.ID
    MemberID      uint     	`gorm:"primaryKey" json:"member_id"`	// FK -> Member.ID
    Status        string     `json:"status"`// sent, delivered, read 
    ReadTimestamp *time.Time	`json:"read_at"`

    IsDeleted bool    	 `json:"is_deleted"`  // user นี้ลบข้อความนี้ไปแล้วหรือยัง
    DeletedAt *time.Time  `json:"delete_at"`

	// ความสัมพันธ์
    Message Message `gorm:"foreignKey:MessageID;references:ID" json:"message,omitempty"`
    Member  Member  `gorm:"foreignKey:MemberID;references:ID" json:"member,omitempty"`
}
