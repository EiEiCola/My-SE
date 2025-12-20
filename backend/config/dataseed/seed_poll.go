package dataseed

import (
	"log"

	"github.com/sut68/team12/backend/internal/entity"
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

	// 2. Ensure we have members for sample polls
	member1, member2 := ensurePollMembers(db)

	// 3. Ensure we have admin for approvals (✅ do NOT create new admin)
	adminID := ensurePollAdmin(db)

	// 4. Ensure we have categories (if your project already seeds categories, this will just reuse them)
	mainCat, subL1, subL2 := ensurePollCategories(db, adminID)

	// 5. Create sample polls in different states
	seedSamplePolls(db, member1.ID, member2.ID, adminID, mainCat.ID, subL1.ID, subL2.ID)

	log.Println("--- Poll System Seeded Successfully ---")
}

// Helper: Ensure members exist
func ensurePollMembers(db *gorm.DB) (entity.Member, entity.Member) {
	m1 := entity.Member{Username: "member01", FirstName: "Somchai", StudentID: "S6500001", GenderID: 1, ActiveStatusID: 1}
	db.Where("username = ?", m1.Username).FirstOrCreate(&m1)

	m2 := entity.Member{Username: "member02", FirstName: "Somsri", StudentID: "S6500002", GenderID: 2, ActiveStatusID: 1}
	db.Where("username = ?", m2.Username).FirstOrCreate(&m2)

	return m1, m2
}

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
	// Poll 1: DRAFT
	poll1 := entity.Poll{
		Question:      "ชอบสีเสื้อทีมสีไหนมากที่สุด?",
		AllowMultiple: false,
		MemberID:      member1ID,
		PollStatusID:  1, // DRAFT
	}
	if mainCatID != 0 {
		poll1.MainCategoryID = &mainCatID
	}
	if subL1ID != 0 {
		poll1.SubCategoryL1ID = &subL1ID
	}
	if err := db.Where("question = ? AND member_id = ?", poll1.Question, poll1.MemberID).FirstOrCreate(&poll1).Error; err == nil {
		opts1 := []entity.PollOption{
			{PollID: poll1.ID, Label: "สีแดง", SortOrder: 1},
			{PollID: poll1.ID, Label: "สีน้ำเงิน", SortOrder: 2},
			{PollID: poll1.ID, Label: "สีเหลือง", SortOrder: 3},
		}
		for _, opt := range opts1 {
			db.Where("poll_id = ? AND label = ?", opt.PollID, opt.Label).FirstOrCreate(&opt)
		}
	}

	// Poll 2: PENDING_REVIEW
	poll2 := entity.Poll{
		Question:      "ควรจัดกิจกรรมกีฬาสีในเดือนไหน?",
		AllowMultiple: false,
		MemberID:      member2ID,
		PollStatusID:  2, // PENDING_REVIEW
	}
	if mainCatID != 0 {
		poll2.MainCategoryID = &mainCatID
	}
	if subL1ID != 0 {
		poll2.SubCategoryL1ID = &subL1ID
	}
	if subL2ID != 0 {
		poll2.SubCategoryL2ID = &subL2ID
	}
	if err := db.Where("question = ? AND member_id = ?", poll2.Question, poll2.MemberID).FirstOrCreate(&poll2).Error; err == nil {
		opts2 := []entity.PollOption{
			{PollID: poll2.ID, Label: "มกราคม", SortOrder: 1},
			{PollID: poll2.ID, Label: "กุมภาพันธ์", SortOrder: 2},
			{PollID: poll2.ID, Label: "มีนาคม", SortOrder: 3},
		}
		for _, opt := range opts2 {
			db.Where("poll_id = ? AND label = ?", opt.PollID, opt.Label).FirstOrCreate(&opt)
		}
	}

	// Poll 3: PUBLISHED (multi-choice)
	poll3 := entity.Poll{
		Question:      "อยากให้ชมรมจัดกิจกรรมอะไรบ้าง? (เลือกได้มากกว่า 1)",
		AllowMultiple: true,
		MaxChoice:     intPtr(2),
		MemberID:      member1ID,
		PollStatusID:  3, // PUBLISHED
	}
	if mainCatID != 0 {
		poll3.MainCategoryID = &mainCatID
	}
	if subL1ID != 0 {
		poll3.SubCategoryL1ID = &subL1ID
	}

	if err := db.Where("question = ? AND member_id = ?", poll3.Question, poll3.MemberID).FirstOrCreate(&poll3).Error; err == nil {
		opts3 := []entity.PollOption{
			{PollID: poll3.ID, Label: "กิจกรรมกีฬา", SortOrder: 1},
			{PollID: poll3.ID, Label: "กิจกรรมดนตรี", SortOrder: 2},
			{PollID: poll3.ID, Label: "กิจกรรมอาสา", SortOrder: 3},
			{PollID: poll3.ID, Label: "กิจกรรมศิลปะ", SortOrder: 4},
		}
		for _, opt := range opts3 {
			db.Where("poll_id = ? AND label = ?", opt.PollID, opt.Label).FirstOrCreate(&opt)
		}

		// ✅ Seed vote: 1 คน 1 โพล 1 ครั้ง แต่เลือกได้หลาย option ผ่าน PollVoteOption
		var picked []uint
		if opt1 := getOptionByLabel(db, poll3.ID, "กิจกรรมกีฬา"); opt1 != nil {
			picked = append(picked, opt1.ID)
		}
		if opt2 := getOptionByLabel(db, poll3.ID, "กิจกรรมดนตรี"); opt2 != nil {
			picked = append(picked, opt2.ID)
		}
		seedVote(db, poll3.ID, picked, member2ID)
	}

	// Poll 4: REJECTED
	poll4 := entity.Poll{
		Question:         "ควรยกเลิกการสอบไหม?",
		AllowMultiple:    false,
		MemberID:         member2ID,
		PollStatusID:     4, // REJECTED
		LastRejectReason: "คำถามไม่เหมาะสมกับนโยบายของมหาวิทยาลัย",
	}
	if err := db.Where("question = ? AND member_id = ?", poll4.Question, poll4.MemberID).FirstOrCreate(&poll4).Error; err == nil {
		opts4 := []entity.PollOption{
			{PollID: poll4.ID, Label: "ควร", SortOrder: 1},
			{PollID: poll4.ID, Label: "ไม่ควร", SortOrder: 2},
		}
		for _, opt := range opts4 {
			db.Where("poll_id = ? AND label = ?", opt.PollID, opt.Label).FirstOrCreate(&opt)
		}
	}

	// Poll 5: CLOSED
	poll5 := entity.Poll{
		Question:     "อยากให้เปิดร้านอาหารประเภทไหนในมหาวิทยาลัย?",
		AllowMultiple:false,
		MemberID:     member1ID,
		PollStatusID: 5, // CLOSED
	}
	if mainCatID != 0 {
		poll5.MainCategoryID = &mainCatID
	}
	if subL1ID != 0 {
		poll5.SubCategoryL1ID = &subL1ID
	}
	if subL2ID != 0 {
		poll5.SubCategoryL2ID = &subL2ID
	}

	if err := db.Where("question = ? AND member_id = ?", poll5.Question, poll5.MemberID).FirstOrCreate(&poll5).Error; err == nil {
		opts5 := []entity.PollOption{
			{PollID: poll5.ID, Label: "ร้านอาหารญี่ปุ่น", SortOrder: 1},
			{PollID: poll5.ID, Label: "ร้านอาหารเกาหลี", SortOrder: 2},
			{PollID: poll5.ID, Label: "ร้านอาหารไทย", SortOrder: 3},
		}
		for _, opt := range opts5 {
			db.Where("poll_id = ? AND label = ?", opt.PollID, opt.Label).FirstOrCreate(&opt)
		}

		// seed votes for closed poll
		if o1 := getOptionByLabel(db, poll5.ID, "ร้านอาหารญี่ปุ่น"); o1 != nil {
			seedVote(db, poll5.ID, []uint{o1.ID}, member2ID)
		}
		if o2 := getOptionByLabel(db, poll5.ID, "ร้านอาหารไทย"); o2 != nil {
			seedVote(db, poll5.ID, []uint{o2.ID}, member1ID)
		}
	}

	log.Println("✅ Sample polls seeded successfully")
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

	// ✅ ใช้ FirstOrCreate เพื่อไม่ให้ log "record not found"
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
