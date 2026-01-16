package dataseed

import (
	"log"

	"github.com/sut68/team12/backend/internal/entity"
	"gorm.io/gorm"
)

func SeedSeparateCategories(db *gorm.DB) {
	// 1. Report Statuses (สำคัญ! ต้อง seed ก่อน)
	reportStatuses := []entity.ReportStatus{
		{ID: 1, Name: "รอดำเนินการ"},
		{ID: 2, Name: "กำลังดำเนินการ"},
		{ID: 3, Name: "เสร็จสิ้น"},
		{ID: 4, Name: "ปฏิเสธ"},
	}

	for _, status := range reportStatuses {
		var exist entity.ReportStatus
		if err := db.Where("id = ?", status.ID).First(&exist).Error; err != nil {
			if err := db.Create(&status).Error; err != nil {
				log.Println("❌ Create ReportStatus failed:", status.Name, err)
			} else {
				log.Println("✅ ReportStatus seeded:", status.Name)
			}
		}
	}

	// 2. Announcement Categories
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

	// 3. Report Reasons
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

	// 4. Target Types (สำหรับระบบ Report)
	targetTypes := []entity.TargetType{
		{Name: "bug", Description: "แจ้งปัญหาการใช้งาน (Bug)", DisplayOrder: 1},
		{Name: "member", Description: "รายงานสมาชิก", DisplayOrder: 2},
		{Name: "suggestion", Description: "ข้อเสนอแนะ / คำแนะนำ", DisplayOrder: 3},
		{Name: "post", Description: "โพสต์", DisplayOrder: 4},
		{Name: "review", Description: "รีวิว", DisplayOrder: 5},
	}

	for _, tt := range targetTypes {
		var exist entity.TargetType
		if err := db.Where("name = ?", tt.Name).First(&exist).Error; err != nil {
			if err := db.Create(&tt).Error; err != nil {
				log.Println("❌ Create TargetType failed:", tt.Name, err)
			} else {
				log.Println("✅ TargetType seeded:", tt.Name)
			}
		}
	}
}
