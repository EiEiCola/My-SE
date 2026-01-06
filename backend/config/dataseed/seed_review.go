package dataseed

import (
	"log"

	"github.com/sut68/team12/backend/internal/entity"
	"gorm.io/gorm"
)

func SeedReviewSystem(db *gorm.DB) {
	log.Println("--- Start Seeding Review System ---")

	// 1. เตรียม Admin (สำหรับฟิลด์ CreatedByAdmin)
	adminID := ensureAdmin(db)

	// 2. เตรียมโครงสร้างหมวดหมู่ (Hierarchy)
	mainCat, l1In, l1Out, l2A := ensureCategories(db, adminID)

	// 3. เตรียมสมาชิก (Members)
	member1, member2 := ensureMembers(db)

	// 4. เตรียม Tags
	tagMap := ensureTags(db, []string{"สะอาด", "เดินทางสะดวก", "เสียงดัง", "ราคาประหยัด", "เน็ตแรง"})

	// 5. รายการรีวิวที่ต้องการ Seed (เพิ่มกี่อันก็ได้ที่นี่)
	reviewsToSeed := []entity.Review{
		{
			Title:           "หอในโซน A ดีมาก",
			Content:         "เดินทางไปเรียนสะดวกมาก ใกล้โรงอาหาร ของกินเยอะ",
			Rating:          5,
			IsAnonymous:     false,
			MemberID:        member1.ID,
			MainCategoryID:  &mainCat.ID,
			SubCategoryL1ID: &l1In.ID,
			SubCategoryL2ID: &l2A.ID,
		},
		{
			Title:           "รีวิวหอนอก สำหรับคนมีรถ",
			Content:         "หอเงียบสงบดีมาก แต่ถ้าไม่มีมอเตอร์ไซค์จะลำบากหน่อย",
			Rating:          4,
			IsAnonymous:     true,
			MemberID:        member2.ID,
			MainCategoryID:  &mainCat.ID,
			SubCategoryL1ID: &l1Out.ID,
		},
		{
			Title:           "หอในโซน A แอบเสียงดัง",
			Content:         "ผนังห้องบางไปหน่อย ได้ยินเสียงข้างห้องคุยกันตลอด",
			Rating:          2,
			IsAnonymous:     false,
			MemberID:        member2.ID,
			MainCategoryID:  &mainCat.ID,
			SubCategoryL1ID: &l1In.ID,
			SubCategoryL2ID: &l2A.ID,
		},
	}

	// 6. วน Loop สร้างรีวิวและข้อมูลประกอบ (Tags, Images, Votes)
	for _, r := range reviewsToSeed {
		// บันทึก Review (กันซ้ำด้วย Title + MemberID)
		if err := db.Where("title = ? AND member_id = ?", r.Title, r.MemberID).FirstOrCreate(&r).Error; err != nil {
			log.Printf("Error seeding review '%s': %v\n", r.Title, err)
			continue
		}

		// ใส่รูปภาพประกอบ (ตัวอย่าง)
		seedReviewImage(db, r.ID)

		// สุ่มใส่ Tag ให้รีวิว (เช่น ใส่ Tag "สะอาด")
		if r.Rating >= 4 {
			seedReviewTag(db, r.ID, tagMap["สะอาด"].ID)
		}

		// อัปเดตคะแนน Vote เบื้องต้น
		syncReviewVotes(db, r.ID)
	}

	log.Println("--- Review System Seeded Successfully ---")
}

// --- Helper Functions เพื่อความสะอาดของโค้ด ---

func ensureAdmin(db *gorm.DB) uint {
	admin := entity.Admin{FirstName: "Seed", LastName: "Admin"}
	db.Where("first_name = ?", admin.FirstName).FirstOrCreate(&admin)
	return admin.ID
}

func ensureCategories(db *gorm.DB, adminID uint) (entity.MainCategory, entity.SubCategoryL1, entity.SubCategoryL1, entity.SubCategoryL2) {
	// Main
	main := entity.MainCategory{Title: "หอพัก", CreatedByAdmin: adminID}
	db.Where("title = ?", main.Title).FirstOrCreate(&main)

	// L1
	l1In := entity.SubCategoryL1{Title: "หอใน", MainCategoryID: main.ID, CreatedByAdmin: adminID}
	db.Where("title = ? AND main_category_id = ?", l1In.Title, l1In.MainCategoryID).FirstOrCreate(&l1In)

	l1Out := entity.SubCategoryL1{Title: "หอนอก", MainCategoryID: main.ID, CreatedByAdmin: adminID}
	db.Where("title = ? AND main_category_id = ?", l1Out.Title, l1Out.MainCategoryID).FirstOrCreate(&l1Out)

	// L2
	l2A := entity.SubCategoryL2{Title: "โซน A", SubCategoryL1ID: l1In.ID, CreatedByAdmin: adminID}
	db.Where("title = ? AND sub_category_l1_id = ?", l2A.Title, l2A.SubCategoryL1ID).FirstOrCreate(&l2A)

	return main, l1In, l1Out, l2A
}

func ensureMembers(db *gorm.DB) (entity.Member, entity.Member) {
	// 1. Ensure "member" role exists
	memberRole := entity.Role{RoleName: "member"}
	db.Where("role_name = ?", memberRole.RoleName).FirstOrCreate(&memberRole)

	// 2. Define member data with their account info
	membersData := []struct {
		Email      string
		Password   string
		Username   string
		FirstName  string
		LastName   string
		StudentID  string
		NationalID string
		GenderID   uint
	}{
		{
			Email:      "member01@sut.ac.th",
			Password:   "$2a$10$dummyhash1234567890abc", // Pre-hashed password for seed
			Username:   "member01",
			FirstName:  "Somchai",
			LastName:   "Seedmember",
			StudentID:  "S6500001",
			NationalID: "1234567890001",
			GenderID:   1,
		},
		{
			Email:      "member02@sut.ac.th",
			Password:   "$2a$10$dummyhash1234567890xyz", // Pre-hashed password for seed
			Username:   "member02",
			FirstName:  "Somsri",
			LastName:   "Seedmember",
			StudentID:  "S6500002",
			NationalID: "1234567890002",
			GenderID:   2,
		},
	}

	var members []entity.Member

	for _, data := range membersData {
		// 3. Create or find MemberAccount first (by email)
		account := entity.MemberAccount{
			Email:        data.Email,
			PasswordHash: data.Password,
			RoleID:       memberRole.ID,
			IsLocked:     false,
		}
		if err := db.Where("email = ?", account.Email).FirstOrCreate(&account).Error; err != nil {
			log.Printf("Error creating MemberAccount for %s: %v\n", data.Email, err)
			continue
		}

		// 4. Check if Member already exists for this account
		var existingMember entity.Member
		if err := db.Where("member_account_id = ?", account.ID).First(&existingMember).Error; err == nil {
			// Member already exists, use it
			members = append(members, existingMember)
			continue
		}

		// 5. Check if Member exists by username (legacy data)
		if err := db.Where("username = ?", data.Username).First(&existingMember).Error; err == nil {
			// Update existing member to link to account if not already linked
			if existingMember.MemberAccountID == 0 {
				db.Model(&existingMember).Update("member_account_id", account.ID)
			}
			members = append(members, existingMember)
			continue
		}

		// 6. Create new Member linked to the account
		member := entity.Member{
			Username:        data.Username,
			FirstName:       data.FirstName,
			LastName:        data.LastName,
			StudentID:       data.StudentID,
			NationalID:      data.NationalID,
			GenderID:        data.GenderID,
			ActiveStatusID:  1,
			MemberAccountID: account.ID,
		}

		if err := db.Create(&member).Error; err != nil {
			log.Printf("Error creating Member %s: %v\n", data.Username, err)
			continue
		}
		members = append(members, member)
	}

	// Return the two members (or empty if failed)
	if len(members) >= 2 {
		return members[0], members[1]
	} else if len(members) == 1 {
		return members[0], entity.Member{}
	}
	return entity.Member{}, entity.Member{}
}

func ensureTags(db *gorm.DB, names []string) map[string]entity.Tag {
	tagMap := make(map[string]entity.Tag)
	for _, name := range names {
		t := entity.Tag{Name: name}
		db.Where("name = ?", name).FirstOrCreate(&t)
		tagMap[name] = t
	}
	return tagMap
}

func seedReviewImage(db *gorm.DB, reviewID uint) {
	img := entity.ReviewImage{
		URL:      "/uploads/default.png",
		IsCover:  true,
		ReviewID: reviewID,
	}
	db.Where("review_id = ?", reviewID).FirstOrCreate(&img)
}

func seedReviewTag(db *gorm.DB, reviewID uint, tagID uint) {
	rt := entity.ReviewTag{ReviewID: reviewID, TagID: tagID}
	db.Where("review_id = ? AND tag_id = ?", rt.ReviewID, rt.TagID).FirstOrCreate(&rt)
}

func syncReviewVotes(db *gorm.DB, reviewID uint) {
	var helpful, notHelpful int64
	db.Model(&entity.ReviewVote{}).Where("review_id = ? AND vote_type = ?", reviewID, "helpful").Count(&helpful)
	db.Model(&entity.ReviewVote{}).Where("review_id = ? AND vote_type = ?", reviewID, "not_helpful").Count(&notHelpful)

	db.Model(&entity.Review{}).Where("id = ?", reviewID).Updates(map[string]any{
		"helpful_count":     int(helpful),
		"not_helpful_count": int(notHelpful),
	})
}

func seedReviewVotes(db *gorm.DB, reviewID uint, votes []entity.ReviewVote) {
	for _, v := range votes {
		// กันค่าหลุด
		if v.VoteType != "helpful" && v.VoteType != "not_helpful" {
			continue
		}
		v.ReviewID = reviewID

		// กันซ้ำ: 1 member โหวตได้ 1 ครั้งต่อ 1 review
		existing := entity.ReviewVote{}
		err := db.Where("review_id = ? AND member_id = ?", v.ReviewID, v.MemberID).
			First(&existing).Error

		if err == nil {
			// ถ้ามีแล้ว ไม่ต้องไปเปลี่ยนของเดิม (seed ควรเป็น idempotent)
			continue
		}

		// ไม่พบ -> สร้างใหม่
		_ = db.Create(&v).Error
	}
}
