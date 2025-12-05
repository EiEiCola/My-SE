package entity

import (
	"time"
)

type RoomChat struct {

	ID          uint      	`gorm:"column:room_id;primaryKey;autoIncrement" json:"room_id"`
	Type  		string    	`json:"rc_type"` // "private" หรือ "group"
	Name  		string    	`json:"rc_name"`
	AvatarURL  	string    	`json:"rc_url"` 
	CreatedBy   int      	`json:"created_by"` // FK -> Member.ID
	CreatedAt  	time.Time 	`json:"created_at"`

	// ความสัมพันธ์
	Member  []RoomMember `gorm:"foreignKey:RoomID;references:ID" json:"member"`
    Messages []Message    `gorm:"foreignKey:RoomID;references:ID" json:"message"`

}