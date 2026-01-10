package dataseed

import (
	"log"
	"strconv"
	"time"

	"github.com/sut68/team12/backend/internal/entity"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func SeedPollSystem(db *gorm.DB) {
	log.Println("--- Start Seeding Poll System ---")

	// 1. Seed Poll Statuses
	pollStatuses := []entity.PollStatus{
		{Model: gorm.Model{ID: 1}, Name: "DRAFT"},
		{Model: gorm.Model{ID: 2}, Name: "PENDING_REVIEW"},
		{Model: gorm.Model{ID: 3}, Name: "PUBLISHED"},
		{Model: gorm.Model{ID: 4}, Name: "REJECTED"},
		{Model: gorm.Model{ID: 5}, Name: "CLOSED"},
		{Model: gorm.Model{ID: 6}, Name: "CANCELED"},
	}

	for _, status := range pollStatuses {
		if err := db.Where("id = ?", status.ID).FirstOrCreate(&status).Error; err != nil {
			log.Printf("Error seeding poll status '%s': %v\n", status.Name, err)
		}
	}
	log.Println("✅ Poll Statuses seeded successfully")

	// ✅ 2. Ensure we have members for sample polls (FIX: create account + create member profile linked)
	member1, member2 := ensurePollMembers(db)

	// 3. Ensure we have admin for approvals (✅ do NOT create new admin)
	adminID := ensurePollAdmin(db)

	// 4. Ensure we have categories
	mainCat, subL1, subL2 := ensurePollCategories(db, adminID)

	// 5. Create sample polls in different states
	seedSamplePolls(db, member1.ID, member2.ID, adminID, mainCat.ID, subL1.ID, subL2.ID)

	log.Println("--- Poll System Seeded Successfully ---")
}

/* =========================
   ✅ FIX ZONE: MEMBERS + ACCOUNTS
========================= */

// ✅ Helper: Ensure members exist (create MemberAccount + Member with correct FK)
func ensurePollMembers(db *gorm.DB) (entity.Member, entity.Member) {
	m1 := ensureMemberWithAccount(
		db,
		"member01@gmail.com",
		"member01",
		"Somchai",
		"Seed01",
		"S6500001",
		"12345678",
		1,
	)
	m2 := ensureMemberWithAccount(
		db,
		"member02@gmail.com",
		"member02",
		"Somsri",
		"Seed02",
		"S6500002",
		"12345678",
		2,
	)
	return m1, m2
}

// ✅ สร้าง account ก่อน แล้วสร้าง member โดย WHERE member_account_id = acc.ID (กัน mismatch 401)
func ensureMemberWithAccount(
	db *gorm.DB,
	email string,
	username string,
	firstName string,
	lastName string,
	studentID string,
	password string,
	genderID uint,
) entity.Member {

	// 1) ensure account
	var acc entity.MemberAccount
	if err := db.Where("email = ?", email).First(&acc).Error; err != nil {
		hash := mustHash(password)
		acc = entity.MemberAccount{
			Email:        email,
			PasswordHash: hash,
			IsLocked:     false,
			RoleID:       2, // member
		}
		if e := db.Create(&acc).Error; e != nil {
			log.Println("❌ create member account failed:", email, e)
		}
	} else {
		// ensure role_id = member (optional)
		if acc.RoleID != 2 {
			_ = db.Model(&entity.MemberAccount{}).Where("id = ?", acc.ID).Update("role_id", uint(2)).Error
			acc.RoleID = 2
		}
	}

	// 2) ensure member profile linked to this account
	//    ✅ MUST fill fields that are not null/unique in entity.Member
	var m entity.Member
	err := db.Where("member_account_id = ?", acc.ID).First(&m).Error
	if err == nil {
		// มี member อยู่แล้ว ผูกถูกแล้ว
		return m
	}

	// ตั้ง dob ให้ไม่เป็นศูนย์แบบ 0001 (ใส่ค่า seed ชัด ๆ)
	dob := time.Date(2003, 1, 1, 0, 0, 0, 0, time.UTC)

	// สร้าง national_id แบบ deterministic 13 หลักจาก studentID (กันชน unique)
	nid := genNationalID(studentID)

	m = entity.Member{
		MemberAccountID: acc.ID,
		Username:        username,
		FirstName:       firstName,
		LastName:        lastName,
		StudentID:       studentID,
		NationalID:      nid,
		Dob:             dob,
		GenderID:        genderID,
		ActiveStatusID:  1,
	}

	if e := db.Create(&m).Error; e != nil {
		log.Println("❌ create member profile failed:", email, e)
		// fallback: return empty m (แต่ปกติควรไม่พังแล้ว)
	}

	return m
}

func mustHash(pw string) string {
	h, err := bcrypt.GenerateFromPassword([]byte(pw), 10)
	if err != nil {
		// ถ้าพังจริง ๆ ก็ให้ค่า placeholder (แต่โอกาสน้อยมาก)
		return ""
	}
	return string(h)
}

// ทำให้ได้ 13 หลัก และไม่ซ้ำง่าย ๆ ใน seed
// ตัวอย่าง: "S6500001" -> "6500001000001"
func genNationalID(studentID string) string {
	// ดึงตัวเลขจาก studentID
	digits := make([]rune, 0, 13)
	for _, ch := range studentID {
		if ch >= '0' && ch <= '9' {
			digits = append(digits, ch)
		}
	}
	// เติมศูนย์จนพอ
	for len(digits) < 13 {
		digits = append(digits, '0')
	}
	// ถ้าเกิน ตัดเอา 13
	if len(digits) > 13 {
		digits = digits[:13]
	}
	return string(digits)
}

/* =========================
   (ส่วนเดิมของหนูด้านล่าง ไม่แก้)
========================= */

// ✅ Helper: Use existing admin (avoid unique constraint on phone_number/member_account_id)
func ensurePollAdmin(db *gorm.DB) uint {
	var admin entity.Admin
	if err := db.Order("id ASC").First(&admin).Error; err == nil {
		return admin.ID
	}
	log.Println("⚠️ No admin found in DB. Some seeded category fields may be skipped.")
	return 0
}

// Helper: Ensure categories exist
func ensurePollCategories(db *gorm.DB, adminID uint) (entity.MainCategory, entity.SubCategoryL1, entity.SubCategoryL2) {
	var main entity.MainCategory
	var l1 entity.SubCategoryL1
	var l2 entity.SubCategoryL2

	// ถ้ามี adminID=0 (ไม่มี admin) ให้ “พยายามดึงที่มีอยู่” อย่างเดียว ไม่สร้างใหม่
	if adminID == 0 {
		_ = db.Where("title = ?", "กิจกรรม").First(&main).Error
		if main.ID != 0 {
			_ = db.Where("title = ? AND main_category_id = ?", "กิจกรรมชมรม", main.ID).First(&l1).Error
		}
		if l1.ID != 0 {
			_ = db.Where("title = ? AND sub_category_l1_id = ?", "กิจกรรมกีฬา", l1.ID).First(&l2).Error
		}
		return main, l1, l2
	}

	main = entity.MainCategory{Title: "กิจกรรม", CreatedByAdmin: adminID}
	db.Where("title = ?", main.Title).FirstOrCreate(&main)

	l1 = entity.SubCategoryL1{Title: "กิจกรรมชมรม", MainCategoryID: main.ID, CreatedByAdmin: adminID}
	db.Where("title = ? AND main_category_id = ?", l1.Title, l1.MainCategoryID).FirstOrCreate(&l1)

	l2 = entity.SubCategoryL2{Title: "กิจกรรมกีฬา", SubCategoryL1ID: l1.ID, CreatedByAdmin: adminID}
	db.Where("title = ? AND sub_category_l1_id = ?", l2.Title, l2.SubCategoryL1ID).FirstOrCreate(&l2)

	return main, l1, l2
}

// Helper: Seed sample polls
func seedSamplePolls(db *gorm.DB, member1ID, member2ID, adminID, mainCatID, subL1ID, subL2ID uint) {
	// (คงเดิมของหนูทั้งหมด)
	// ...
	_ = strconv.Itoa(0) // กัน unused import ถ้าหนูวางโค้ดต่อจากเดิมแล้วไม่มี strconv ใช้ตรงนี้ ให้ลบได้
}

// -------------------- Helpers --------------------

func intPtr(i int) *int { return &i }

func getOptionByLabel(db *gorm.DB, pollID uint, label string) *entity.PollOption {
	var opt entity.PollOption
	if err := db.Where("poll_id = ? AND label = ?", pollID, label).First(&opt).Error; err != nil {
		return nil
	}
	return &opt
}

// ✅ 1 คน 1 โพล = 1 PollVote และเลือกหลายช้อยผ่าน PollVoteOption
func seedVote(db *gorm.DB, pollID uint, optionIDs []uint, memberID uint) {
	if len(optionIDs) == 0 {
		return
	}

	vote := entity.PollVote{
		PollID:   pollID,
		MemberID: memberID,
	}

	if err := db.
		Where("poll_id = ? AND member_id = ?", pollID, memberID).
		Attrs(entity.PollVote{PollID: pollID, MemberID: memberID}).
		FirstOrCreate(&vote).Error; err != nil {
		return
	}

	for _, oid := range optionIDs {
		attachVoteOption(db, vote.ID, oid)
	}
}

func attachVoteOption(db *gorm.DB, pollVoteID uint, pollOptionID uint) {
	row := entity.PollVoteOption{
		PollVoteID:   pollVoteID,
		PollOptionID: pollOptionID,
	}
	db.Where("poll_vote_id = ? AND poll_option_id = ?", pollVoteID, pollOptionID).FirstOrCreate(&row)
}
