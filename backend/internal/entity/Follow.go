package entity

import (
	"time"
)

// Follow คือ การติดตาม ไม่ได้หมายถึงการเป็นเพื่อนเสมอไป
// สามารถใช้สำหรับฟังก์ชัน Mute/Unmute ได้
type Follow struct {
	ID int `gorm:"column:f_id;primaryKey;autoIncrement" json:"f_id"`
	FollowerID int `gorm:"column:follower_ID" json:"follower_id"` // คนที่ติดตาม
	FollowedID int `gorm:"column:followed_ID" json:"followed_id"` // คนที่ถูกติดตาม

	// สถานะการติดตาม:
	// 1: Following (เห็นโพสต์)
	// 2: Muted (ยังติดตามแต่ไม่เห็นโพสต์)
	FollowStatusID uint `json:"follow_status_id"`
	FollowStatus FollowStatus `gorm:"foreignKey:FollowStatusID;references:ID"`

	CreatedAt time.Time `gorm:"column:create_at" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:update_at" json:"updated_at,omitempty"`
}
