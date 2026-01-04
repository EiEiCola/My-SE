package dataseed

import (
	"github.com/sut68/team12/backend/internal/entity"
	"gorm.io/gorm"
)

func SeedStatusData(db *gorm.DB) {
	// 1. Seed ข้อมูลสถานะคำขอเป็นเพื่อน (RequesStatus)
	requestStatuses := []entity.RequesStatus{
		{ID: 1, Name: "Pending"},
		{ID: 2, Name: "Accepted"},
		{ID: 3, Name: "Rejected"},
		{ID: 4, Name: "Cancelled"},
	}

	for _, rs := range requestStatuses {
		// ใช้ FirstOrCreate เพื่อไม่ให้ข้อมูลซ้ำซ้อนหากรันโปรแกรมใหม่
		db.Where(entity.RequesStatus{ID: rs.ID}).FirstOrCreate(&rs)
	}

	// 2. Seed ข้อมูลสถานะการติดตาม (FollowStatus)
	followStatuses := []entity.FollowStatus{
		{ID: 1, Name: "Following"}, // กำลังติดตาม
		{ID: 2, Name: "Muted"},     // ติดตามอยู่แต่ซ่อนโพสต์
		{ID: 3, Name: "Unfollow"},   // เลิกติดตาม
	}

	for _, fs := range followStatuses {
		db.Where(entity.FollowStatus{ID: fs.ID}).FirstOrCreate(&fs)
	}
}