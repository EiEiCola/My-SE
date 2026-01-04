package entity

import (
	"fmt"
	"time"
)

// Follow คือ การติดตาม ไม่ได้หมายถึงการเป็นเพื่อนเสมอไป
// สามารถใช้สำหรับฟังก์ชัน Mute/Unmute ได้
type Follow struct {
	ID         int `gorm:"column:f_id;primaryKey;autoIncrement" json:"f_id"`
	FollowerID int `gorm:"column:follower_ID" json:"follower_id"` // คนที่ติดตาม
	FollowedID int `gorm:"column:followed_ID" json:"followed_id"` // คนที่ถูกติดตาม

	FollowStatusID uint         `json:"follow_status_id"`
	FollowStatus   FollowStatus `gorm:"foreignKey:follow_status_id;references:ID"`

	CreatedAt time.Time `gorm:"column:create_at" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:update_at" json:"updated_at,omitempty"`
}

func ValidateFollow(follow Follow) (bool, error) {
	if follow.FollowerID == 0 {
		return false, fmt.Errorf("Follower ID is required")
	}
	if follow.FollowedID == 0 {
		return false, fmt.Errorf("Followed ID is required")
	}
	if follow.FollowerID == follow.FollowedID {
		return false, fmt.Errorf("Cannot follow yourself")
	}
	if follow.FollowStatusID == 0 {
		return false, fmt.Errorf("FollowStatus ID is required")
	}
	return true, nil
}