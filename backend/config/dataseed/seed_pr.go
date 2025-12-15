package dataseed

import (
	"log"
	"time"

	"github.com/sut68/team12/backend/internal/entity"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func SeedPRSystem(db *gorm.DB) {
	log.Println("Seeding PR System Data...")

	// 1. Seed PRSubmissionStatus
	prStatuses := []entity.PRSubmissionStatus{
		{ID: 1, Name: "Pending"},
		{ID: 2, Name: "Approved"},
		{ID: 3, Name: "Rejected"},
	}
	for _, s := range prStatuses {
		db.FirstOrCreate(&s, entity.PRSubmissionStatus{ID: s.ID})
	}

	// 2. Seed AnnouncementStatus
	annStatuses := []entity.AnnouncementStatus{
		{ID: 1, Name: "Active"},
		{ID: 2, Name: "Inactive"},
	}
	for _, s := range annStatuses {
		db.FirstOrCreate(&s, entity.AnnouncementStatus{ID: s.ID})
	}

	// 3. Ensure Gender Exists
	gender := entity.Gender{GenderID: 1, GenderName: "Male"}
	db.FirstOrCreate(&gender, entity.Gender{GenderID: 1})

	// 4. Seed Member & MemberAccount
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("123456"), 14)

	// Create Member first
	member := entity.Member{
		FirstName:     "Member",
		LastName:      "One",
		Username:      "member01",
		MemberPicture: "https://robohash.org/member1",
		GenderID:      1,
		// ID is handled by GORM or we can fetch last inserted
	}
	// Note: We use FirstOrCreate with Username as unique key
	if err := db.Where(entity.Member{Username: "member01"}).FirstOrCreate(&member).Error; err != nil {
		log.Println("Error seeding member:", err)
	}

	// Create Account for Member
	account := entity.MemberAccount{
		MemberID: member.ID,
		Email:    "member01@example.com",
		Password: string(hashedPassword),
		RoleID:   1, // Member Role
	}
	if err := db.Where(entity.MemberAccount{Email: "member01@example.com"}).FirstOrCreate(&account).Error; err != nil {
		log.Println("Error seeding member account:", err)
	}

	// 5. Seed Admin (Optional for now, assuming Admin requires similar complex setup)
	// Just skipping explicit Admin struct creation if not needed for PR FK immediately
	// IF PRSubmission needs AdminID? PRReview needs AdminID (int).
	// Let's seed a Dummy Admin if possible.
	// Assuming Admin table links to MemberAccount?
	// If we don't know Admin struct, we can't seed it safely.
	// But PRReview needs AdminID. Let's try raw SQL or generic map if strictly needed.
	// Or check if Admin is just an ID wrapper?
	// For now, let's assume Admin ID 1 exists or is created by other seeds.
	// If not, PRReview might fail FK.
	// Let's try to seed a basic Admin with id 1 just in case, using raw SQL if Struct is unknown?
	// 5. Seed Admin (Required for Announcement FK)
	adminMember := entity.Member{
		FirstName: "Admin",
		LastName:  "User",
		Username:  "admin01",
		GenderID:  1,
	}
	// Use Unscoped to find existing member even if soft-deleted, to avoid Unique Constraint violation
	db.Unscoped().Where(entity.Member{Username: "admin01"}).FirstOrCreate(&adminMember)

	adminAccount := entity.MemberAccount{
		MemberID: adminMember.ID,
		Email:    "admin01@example.com",
		Password: string(hashedPassword),
		RoleID:   2, // Admin Role (assuming 2)
	}
	db.Unscoped().Where(entity.MemberAccount{Email: "admin01@example.com"}).FirstOrCreate(&adminAccount)

	admin := entity.Admin{
		MemberAccountID: adminAccount.ID,
	}
	// Use FirstOrCreate. Note: Admin table might just have ID and MemberAccountID?
	// Based on likely schema, we try to create it.
	// If Admin has specific fields, we might need to know them.
	// Assuming simple Admin struct based on previous context.
	if err := db.Preload("MemberAccount").Where(entity.Admin{MemberAccountID: adminAccount.ID}).FirstOrCreate(&admin).Error; err != nil {
		log.Println("Error seeding admin:", err)
	}

	// 6. Seed Sample PR Submissions
	submissions := []entity.PRSubmission{
		{
			MemberID:   member.ID,
			Title:      "ขอเชิญร่วมงาน Open House 2025",
			Content:    "ขอประชาสัมพันธ์งาน Open House ประจำปี 2025...",
			ReqStartAt: time.Now(),
			ReqEndAt:   time.Now().AddDate(0, 0, 7),
			StatusID:   1, // Pending
		},
		{
			MemberID:   member.ID,
			Title:      "เปิดรับสมัครค่ายอาสาพัฒนาชนบท",
			Content:    "ชมรมอาสาขอเชิญชวนเพื่อนๆ พี่ๆ น้องๆ เข้าร่วม...",
			ReqStartAt: time.Now().AddDate(0, 0, -1), // Active since yesterday
			ReqEndAt:   time.Now().AddDate(0, 0, 10),
			StatusID:   2, // Approved
		},
	}

	for _, sub := range submissions {
		if err := db.Where(entity.PRSubmission{Title: sub.Title}).FirstOrCreate(&sub).Error; err != nil {
			log.Printf("Error creating submission: %v", err)
		} else {
			// Seed Media for submission
			if sub.Title == "ขอเชิญร่วมงาน Open House 2025" {
				media := entity.PRSubmissionMedia{
					PRID:    sub.ID,
					URL:     "https://via.placeholder.com/800x400?text=Open+House",
					Type:    "image",
					IsCover: true,
				}
				db.FirstOrCreate(&media, entity.PRSubmissionMedia{PRID: sub.ID, URL: media.URL})
			}

			// [NEW] If Approved, create Announcement
			if sub.StatusID == 2 {
				// Use the seeded admin ID
				adminID := admin.ID
				announcement := entity.Announcement{
					PRSubmissionID: &sub.ID,
					Title:          sub.Title,
					Content:        sub.Content,
					PublishStartAt: sub.ReqStartAt,
					PublishEndAt:   sub.ReqEndAt,
					StatusID:       1,        // Active
					AdminID:        &adminID, // Real Admin ID
					CreatedAt:      time.Now(),
					UpdatedAt:      time.Now(),
				}

				// Note: Ensure admin exists or FK check is disabled (in config it is disabled during migrate, but not runtime insert usually unless disabled)
				// We will try to create.
				if err := db.Where(entity.Announcement{Title: announcement.Title}).FirstOrCreate(&announcement).Error; err != nil {
					log.Printf("Error creating announcement: %v", err)
				}
			}
		}
	}

	log.Println("PR System Data Seeded Successfully.")
}
