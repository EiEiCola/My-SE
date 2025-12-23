package config

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	"github.com/sut68/team12/backend/config/dataseed"
	"github.com/sut68/team12/backend/internal/entity"
	"gorm.io/driver/postgres"

	"gorm.io/gorm"
)

// Config func to get env value
func Config(key string) string {
	return os.Getenv(key)
}

// DBURL builds the database connection string
func DBURL() string {
	return fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable TimeZone=Asia/Bangkok",
		Config("DB_HOST"),
		Config("DB_PORT"),
		Config("DB_USER"),
		Config("DB_PASSWORD"),
		Config("DB_NAME"),
	)
}

var DB *gorm.DB

// เชื่อมต่อ database
func Connect() *gorm.DB {
	if err := godotenv.Load(); err != nil {
		log.Println("Note: .env file not found. Using system environment variables instead.")
	}
	//============================== ตอน Dev เท่านั้น
	//s.ResetDatabaseByDROP(db) //ถ้าอยากล้าง ตารางทั้งหมดเลย
	//s.ResetDatabase(db) //ลบข้อมูลในตารางทั้งหมดแล้วค่อย seed
	//dataseed.ResetDatabaseByDROP(db)

	


	dsn := DBURL()
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		DisableForeignKeyConstraintWhenMigrating: true,
		PrepareStmt:                              false,
	})
	if err != nil {
		log.Fatal("Failed to connect to database. ", err)
	}
	log.Println("Connected to database")

	//dataseed.ResetDatabaseByDROP(db) // Reset here

	DB = db
	
	// AutoMigrate entities to create/update tables in the database
	log.Println("Running database migrations...")
	if err := db.AutoMigrate(
		// --- 1. ตารางหลักพื้นฐาน (Master & Core Tables) ---
		&entity.Member{}, // ถูกอ้างอิงเยอะที่สุด
		&entity.Role{},
		&entity.Gender{},
		&entity.ActiveStatus{},

		// --- 2. ตารางผู้ใช้งาน/บัญชี (User & Admin Core) ---
		&entity.MemberAccount{}, // อ้างอิง Member, Role
		&entity.Admin{},         // อ้างอิง MemberAccount <--- ตารางแม่ของ PollHistory/PRReview

		// --- 3. ตารางหมวดหมู่ (Categories) ---
		&entity.MainCategory{},
		&entity.SubCategoryL1{}, // อ้างอิง MainCategory
		&entity.SubCategoryL2{}, // อ้างอิง SubCategoryL1

		// --- 4. ตารางสถานะ/กฎ/ประเภท (Status & Rule Tables) ---
		&entity.AnnouncementStatus{},
		&entity.PRSubmissionStatus{},
		&entity.ReportStatus{},
		&entity.RequesStatus{},
		&entity.PointRule{},
		&entity.Tag{},
		&entity.PollStatus{}, // ถูกอ้างอิงโดย PollHistory

		// --- 5. ตารางลูกระดับกลาง (Medium Complexity) ---
		&entity.Block{},
		&entity.Relations{},
		&entity.RequesFriend{},
		&entity.Reward{},             // อ้างอิง Admin
		&entity.MemberReward{},       // อ้างอิง Member, Reward
		&entity.MemberPointBalance{}, // อ้างอิง Member

		// --- 6. ตารางเนื้อหาหลัก (Core Content Tables) ---
		&entity.Post{},   // อ้างอิง Member, CategoryL2
		&entity.Review{}, // อ้างอิง Member, CategoryL2
		&entity.Poll{},   // อ้างอิง Member, CategoryL2

		// --- 7. ตารางลูกที่ซับซ้อน/อ้างอิงเนื้อหาหลัก (Complex Children) ---
		&entity.Comment{},
		&entity.CommentImage{},
		&entity.CommentAttachment{},
		&entity.PostImage{},
		&entity.PostAttachment{},
		&entity.ReviewImage{},
		&entity.ReviewTag{},
		&entity.ReviewVote{},

		// --- 8. ตาราง Chat (Chat Module) ---
		&entity.RoomChat{},
		&entity.Message{},
		&entity.RoomMember{},
		&entity.MessageStatus{},
		&entity.AttachmentChat{},
		&entity.FollowStatus{},
		&entity.Follow{},

		// --- 9. ตาราง PR & Report (Moderation Module) ---
		&entity.PRSubmission{},
		&entity.PRSubmissionMedia{},
		&entity.PRReview{}, // อ้างอิง PRSubmission, Admin
		&entity.Report{},   // อ้างอิง Member, Admin, Status
		&entity.ReportMedia{},

		&entity.Announcement{}, // อ้างอิง Admin, Status, PRSubmission
		&entity.AnnouncementMedia{},

		&entity.PointTransaction{}, // อ้างอิง Member, Rule, Post, Poll, Review

		// --- 10. ตาราง Poll (ต้องอยู่ท้ายสุดเพราะอ้างอิงหลายตาราง) ---
		&entity.PollOption{},
		&entity.PollVote{},
		&entity.PollVoteOption{}, 
		&entity.PollHistory{}, // <--- อ้างอิง Admin, Poll, PollStatus (ควรอยู่ท้ายสุด)
	); err != nil {
		log.Println("AutoMigrate error (ignored): ", err)
	}
	log.Println("Database migrations completed.")


	
	if err := dataseed.SeedInitialPointsSafe(db, 300); err != nil {
	log.Println("SeedInitialPointsSafe error:", err)
}



	// Data seeding
	// s.SeedRole(db)
	// s.SeedFaculty(db)
	// s.SeedLogin(db)
	// s.SeedUser(db)
	// s.SeedAdmin(db)

	//s.SeedClubAdmin(db)
	// s.SeedClubRequestStatus(db)
	// s.SeedClubMemberStatus(db)
	// s.SeedClubType(db)
	// s.SeedPosition(db)
	// s.SeedClubAdministrator(db)
	// s.SeedClub(db)
	// s.SeedClubRequest(db)
	// s.SeedClubMember(db)
	// s.SeedEvent(db)
	// dataseed.SeedPRSystem(db)
	dataseed.SeedReviewSystem(db)
	dataseed.SeedPollSystem(db)
	return db
}
