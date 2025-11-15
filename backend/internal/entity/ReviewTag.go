package entity

import (
	"time"
	"gorm.io/gorm"
)


type ReviewTag struct {
	gorm.Model
	ReviewID  string    `json:"review_id"`
	TagID     string    `json:"tag_id"`
	CreatedAt time.Time `json:"created_at"`
	//ยังไม่แน่ใจเรื่อง ตารางกลาง
}
