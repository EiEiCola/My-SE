package dataseed

import (
	"errors"
	"log"
	"os"
	"strings"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"github.com/sut68/team12/backend/internal/entity"
)

func SeedAll(db *gorm.DB) {
	SeedGender(db)       // ✅ Seed Gender
	SeedActiveStatus(db) // ✅ Seed ActiveStatus
	seedAdmin(db)
	SeedReviewSystem(db) // ✅ Enable Review/Member seeding
	//seedPointRules(db)
	SeedRewards(db)            // ✅ Seed Rewards
	SeedSeparateCategories(db) // ✅ Seed AnnouncementCategory and ReportReason
}

// Seed PointRules for Star feature
func seedPointRules(db *gorm.DB) {
	rules := []entity.PointRule{
		{
			ActivityType:  "StarPost",
			ActivityPoint: 5, // ให้ 5 แต้มเมื่อมีคนกดดาว
			DailyLimit:    0, // ไม่จำกัดต่อวัน
		},
	}

	for _, rule := range rules {
		var existing entity.PointRule
		if err := db.Where("activity_type = ?", rule.ActivityType).First(&existing).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				if err := db.Create(&rule).Error; err != nil {
					log.Println("❌ create PointRule failed:", rule.ActivityType, err)
				} else {
					log.Println("✅ PointRule seeded:", rule.ActivityType)
				}
			}
		} else {
			log.Println("ℹ️ PointRule already exists:", rule.ActivityType)
		}
	}
}

// Seed admin account 1 คนเท่านั้น (idempotent)
func seedAdmin(db *gorm.DB) {
	adminEmail := strings.TrimSpace(os.Getenv("ADMIN_EMAIL"))
	adminPassword := strings.TrimSpace(os.Getenv("ADMIN_PASSWORD"))

	if adminEmail == "" {
		adminEmail = "admin@gmail.com"
	}
	if adminPassword == "" {
		adminPassword = "admin1234"
	}

	// ถ้ามีแล้ว -> ensure role_id = 1 และ ensure admin profile
	var acc entity.MemberAccount
	if err := db.Where("email = ?", adminEmail).First(&acc).Error; err == nil {

		// ✅ สำคัญ: ถ้า role_id ยังเป็น 0/ไม่ใช่ admin ให้ปรับเป็น 1
		if acc.RoleID != 1 {
			if e := db.Model(&entity.MemberAccount{}).
				Where("id = ?", acc.ID).
				Update("role_id", uint(1)).Error; e != nil {
				log.Println("❌ update admin role_id failed:", e)
			} else {
				log.Println("✅ updated role_id to admin for:", adminEmail)
			}
		}

		log.Println("ℹ️ admin account already exists:", adminEmail)
		ensureAdminProfile(db, acc.ID)
		return
	}

	// ถ้าไม่เจอ -> สร้างใหม่
	if err := db.Where("email = ?", adminEmail).First(&acc).Error; err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		log.Fatal("❌ find admin account error:", err)
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(adminPassword), 10)
	if err != nil {
		log.Fatal("❌ bcrypt error:", err)
	}

	acc = entity.MemberAccount{
		Email:        adminEmail,
		PasswordHash: string(hash),
		IsLocked:     false,
		RoleID:       1, // ✅ admin
	}

	if err := db.Create(&acc).Error; err != nil {
		log.Fatal("❌ cannot create admin account:", err)
	}

	ensureAdminProfile(db, acc.ID)
	log.Println("✅ admin seeded:", adminEmail)
}

// ✅ คืนค่า pointer ของเบอร์ ถ้าเบอร์นี้ยังไม่ถูกใช้โดย admin คนอื่น
func buildUniquePhonePtr(db *gorm.DB, phone string, memberAccountID uint) *string {
	phone = strings.TrimSpace(phone)
	if phone == "" {
		return nil
	}

	var cnt int64
	// นับว่ามี admin คนอื่นใช้เบอร์นี้อยู่ไหม (ยกเว้นของตัวเอง)
	db.Model(&entity.Admin{}).
		Where("phone_number = ? AND member_account_id <> ?", phone, memberAccountID).
		Count(&cnt)

	if cnt > 0 {
		// ซ้ำ -> ไม่ใส่ กัน unique constraint
		return nil
	}
	return &phone
}

func ensureAdminProfile(db *gorm.DB, memberAccountID uint) {
	const seedPhone = "0873734816"

	var a entity.Admin
	err := db.Where("member_account_id = ?", memberAccountID).First(&a).Error

	// ✅ ถ้ามีอยู่แล้ว -> ensure phone (ถ้ายังไม่มี)
	if err == nil {
		if a.PhoneNumber == nil || strings.TrimSpace(*a.PhoneNumber) == "" {
			phonePtr := buildUniquePhonePtr(db, seedPhone, memberAccountID)
			if phonePtr != nil {
				if e := db.Model(&entity.Admin{}).
					Where("id = ?", a.ID).
					Update("phone_number", *phonePtr).Error; e != nil {
					log.Println("❌ update admin phone failed:", e)
				} else {
					log.Println("✅ admin phone updated:", *phonePtr)
				}
			} else {
				log.Println("ℹ️ seed phone duplicated, keep phone_number nil")
			}
		}
		return
	}

	// ✅ error อื่นจริง ๆ
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		log.Println("❌ query admin profile error:", err)
		return
	}

	// ✅ ไม่เจอ -> สร้างใหม่
	phonePtr := buildUniquePhonePtr(db, seedPhone, memberAccountID)

	a = entity.Admin{
		MemberAccountID: memberAccountID,
		Username:        "Admin",
		FirstName:       "Janthima",
		LastName:        "Polsen",
		ProfilePicture:  "",
		PhoneNumber:     phonePtr, // ✅ ใส่ถ้าไม่ซ้ำ

	}

	if err := db.Create(&a).Error; err != nil {
		log.Println("❌ create admin profile failed:", err)
		return
	}
	log.Println("✅ admin profile created for account:", memberAccountID)
}
