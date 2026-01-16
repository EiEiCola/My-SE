package dataseed

import (
	"log"

	"github.com/sut68/team12/backend/internal/entity"
	"gorm.io/gorm"
)

func SeedSeparateCategories(db *gorm.DB) {
	// 1. Announcement Categories
	annCats := []entity.AnnouncementCategory{
		{Title: "ทั่วไป", Description: "ประกาศทั่วไป / General", DisplayOrder: 1},
		{Title: "กิจกรรม", Description: "กิจกรรม / Activity", DisplayOrder: 2},
		{Title: "ทุนการศึกษา", Description: "ทุนการศึกษา / Scholarship", DisplayOrder: 3},
		{Title: "ด่วน", Description: "ด่วน / Urgent", DisplayOrder: 4},
		{Title: "ประชาสัมพันธ์", Description: "ประชาสัมพันธ์ / PR", DisplayOrder: 5},
	}

	for _, c := range annCats {
		var exist entity.AnnouncementCategory
		if err := db.Where("title = ?", c.Title).First(&exist).Error; err != nil {
			if err := db.Create(&c).Error; err != nil {
				log.Println("❌ Create AnnouncementCategory failed:", c.Title, err)
			} else {
				log.Println("✅ AnnouncementCategory seeded:", c.Title)
			}
		}
	}

	// 2. Report Reasons
	reportReasons := []entity.ReportReason{
		{Title: "เนื้อหาไม่เหมาะสม / ลามก", Description: "Inappropriate content", DisplayOrder: 1},
		{Title: "สแปม / โฆษณา", Description: "Spam or Advertising", DisplayOrder: 2},
		{Title: "เนื้อหาแสดงความเกลียดชัง / พาดพิง", Description: "Hate speech", DisplayOrder: 3},
		{Title: "ข้อมูลส่วนตัว / ละเมิดลิขสิทธิ์", Description: "Privacy violation", DisplayOrder: 4},
		{Title: "การข่มขู่ / คุกคาม", Description: "Harassment", DisplayOrder: 5},
		{Title: "เหตุผลอื่นๆ (ระบุเพิ่มเติม)", Description: "Other", DisplayOrder: 6},
	}

	for _, r := range reportReasons {
		var exist entity.ReportReason
		if err := db.Where("title = ?", r.Title).First(&exist).Error; err != nil {
			if err := db.Create(&r).Error; err != nil {
				log.Println("❌ Create ReportReason failed:", r.Title, err)
			} else {
				log.Println("✅ ReportReason seeded:", r.Title)
			}
		}
	}
}
