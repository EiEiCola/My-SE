package entity

import (
	"time"
)
type RoomMember struct {

	RoomID   	uint    `gorm:"primaryKey" json:"room_id"` // FK -> RoomChat.ID
	MemberID  	uint   	`gorm:"primaryKey" json:"member_id"` // FK -> Member.ID
	Role  		string    	`json:"rm_role"`        // "admin", "member"
	JoinedAt  	time.Time 	`json:"joined_at"`
	ClearedAt  time.Time 	`json:"cleared_at"`  // เวลากดลบแชทสำหรับคนนี้ (อาจเป็น nil ได้)

	// ความสัมพันธ์ (optional แต่ช่วยให้ preload ง่าย)
    Room   RoomChat `gorm:"foreignKey:RoomID;references:ID" json:"room,omitempty"`
    Member Member   `gorm:"foreignKey:MemberID;references:ID" json:"member,omitempty"`
}