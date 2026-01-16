package dataseed

import (

	"gorm.io/gorm"

	"github.com/sut68/team12/backend/internal/entity"
)

// ---------- ensure seed point rule (used only for seed txn) ----------
func ensureSeedPointRule(db *gorm.DB, initial int) (uint, error) {
	const activityType = "SEED_INIT"

	var rule entity.PointRule
	err := db.Where("activity_type = ?", activityType).First(&rule).Error
	if err == nil {
		return rule.ID, nil
	}
	if err != gorm.ErrRecordNotFound {
		return 0, err
	}

	rule = entity.PointRule{
		ActivityType:  activityType,
		Description:   "Seed initial points for testing",
		ActivityPoint: initial,
		DailyLimit:    0,
	}

	if ok, vErr := entity.ValidatePointRule(rule); !ok {
		return 0, vErr
	}

	if err := db.Create(&rule).Error; err != nil {
		return 0, err
	}

	return rule.ID, nil
}

// ---------- NEW: Ensure "Post Create" rule exists (Rename if exists) ----------
func EnsurePostCreateRule(db *gorm.DB) error {
	const newType = "Post Create"
	const oldType = "POST_CREATE"
	const desc = "สร้างโพสต์ใหม่เพื่อรับ 5 แต้ม จำกัดการรับเเต้มไม่เกิน 3 ครั้งต่อวัน"

	var rule entity.PointRule
	// 1. Check New Name
	if err := db.Where("activity_type = ?", newType).First(&rule).Error; err == nil {
		// Exist? Force update description and rules
		rule.Description = desc
		rule.ActivityPoint = 5
		rule.DailyLimit = 3
		return db.Save(&rule).Error
	}

	// 2. Check Old Name
	if err := db.Where("activity_type = ?", oldType).First(&rule).Error; err == nil {
		// Rename and update description
		rule.ActivityType = newType
		rule.Description = desc
		rule.ActivityPoint = 5
		rule.DailyLimit = 3
		return db.Save(&rule).Error
	}

	// 3. Create New
	rule = entity.PointRule{
		ActivityType:  newType,
		Description:   desc,
		ActivityPoint: 5,
		DailyLimit:    3,
	}
	return db.Create(&rule).Error
}

// ---------- NEW: Ensure "Review Create" rule exists (Rename if exists) ----------
func EnsureReviewCreateRule(db *gorm.DB) error {
	const newType = "Review Create"
	const oldType = "REVIEW_CREATE"
	const desc = "สร้างรีวิวใหม่เพื่อรับ 10 แต้ม จำกัดการรับเเต้มไม่เกิน 3 ครั้งต่อวัน"

	var rule entity.PointRule
	if err := db.Where("activity_type = ?", newType).First(&rule).Error; err == nil {
		rule.Description = desc
		rule.ActivityPoint = 10
		rule.DailyLimit = 3 // Force update limit
		return db.Save(&rule).Error
	}

	if err := db.Where("activity_type = ?", oldType).First(&rule).Error; err == nil {
		rule.ActivityType = newType
		rule.Description = desc
		rule.ActivityPoint = 10
		rule.DailyLimit = 3 // Force update limit
		return db.Save(&rule).Error
	}

	rule = entity.PointRule{
		ActivityType:  newType,
		Description:   desc,
		ActivityPoint: 10,
		DailyLimit:    3, // Set to 3
	}
	return db.Create(&rule).Error
}

// ---------- NEW: Ensure "Poll Create" rule exists (Rename if exists) ----------
func EnsurePollCreateRule(db *gorm.DB) error {
	const newType = "Poll Create"
	const oldType = "POLL_CREATE"
	const desc = "สร้างโพลใหม่ หากได้รับการอนุมัติโพลจะได้รับ 5 แต้ม จำกัดการรับเเต้มไม่เกิน 3 ครั้งต่อวัน"

	var rule entity.PointRule
	if err := db.Where("activity_type = ?", newType).First(&rule).Error; err == nil {
		rule.Description = desc
		rule.ActivityPoint = 5
		rule.DailyLimit = 3
		return db.Save(&rule).Error
	}

	if err := db.Where("activity_type = ?", oldType).First(&rule).Error; err == nil {
		rule.ActivityType = newType
		rule.Description = desc
		rule.ActivityPoint = 5
		rule.DailyLimit = 3
		return db.Save(&rule).Error
	}

	rule = entity.PointRule{
		ActivityType:  newType,
		Description:   desc,
		ActivityPoint: 5,
		DailyLimit:    3,
	}
	return db.Create(&rule).Error
}

// ---------- NEW: Ensure REVIEW_LIKE_RECEIVED rule exists ----------
func EnsureReviewLikeRule(db *gorm.DB) error {
	const activityType = "Review Quality"

	var rule entity.PointRule
	err := db.Where("activity_type = ?", activityType).First(&rule).Error
	if err == nil {
		// Exist? Force update
		rule.Description = "กดถูกใจเพื่อบอกว่ารีวิวนี้มีคุณภาพ เจ้าของรีวิวได้รับ 15 แต้มต่อ 1 ไลก์ จำกัดการรับแต้มจากรีวิวคุณภาพไม่เกิน 5 ครั้งต่อวัน"
		rule.ActivityPoint = 15
		rule.DailyLimit = 5
		return db.Save(&rule).Error
	}
	if err != gorm.ErrRecordNotFound {
		return err
	}

	rule = entity.PointRule{
		ActivityType:  activityType,
		Description:   "Points received when your review gets a helpful vote",
		ActivityPoint: 15,
		DailyLimit:    5,
	}

	return db.Create(&rule).Error
}

// ---------- NEW: Ensure "Post Quality" rule exists (Rename from StarPost) ----------
func EnsurePostQualityRule(db *gorm.DB) error {
	const newType = "Post Quality"
	const oldType = "StarPost" // Rename from this
	const desc = "กดดาวเพื่อบอกว่าโพสต์นี้มีคุณภาพ เจ้าของโพสต์ได้รับ 10 แต้มต่อ 1 ดาว จำกัดการรับแต้มจากโพสต์คุณภาพไม่เกิน 5 ครั้งต่อวัน"

	var rule entity.PointRule
	// 1. Check New Name
	if err := db.Where("activity_type = ?", newType).First(&rule).Error; err == nil {
		rule.Description = desc
		rule.ActivityPoint = 10
		rule.DailyLimit = 5
		return db.Save(&rule).Error
	}

	// 2. Check Old Name
	if err := db.Where("activity_type = ?", oldType).First(&rule).Error; err == nil {
		rule.ActivityType = newType
		rule.Description = desc
		rule.ActivityPoint = 10
		rule.DailyLimit = 5
		return db.Save(&rule).Error
	}

	// 3. Create New
	rule = entity.PointRule{
		ActivityType:  newType,
		Description:   desc,
		ActivityPoint: 10,
		DailyLimit:    5,
	}
	return db.Create(&rule).Error
}

// ---------- NEW: Ensure "Poll Vote" rule exists ----------
func EnsurePollVoteRule(db *gorm.DB) error {
	const activityType = "Poll Vote"
	const desc = "โหวตเพื่อแสดงความคิดเห็นในโพล เจ้าของโพลได้รับ 10 แต้มต่อ 1 การโหวต จำกัดการรับแต้มจากการโหวตโพลไม่เกิน 5 ครั้งต่อวัน"

	var rule entity.PointRule
	if err := db.Where("activity_type = ?", activityType).First(&rule).Error; err == nil {
		rule.Description = desc
		rule.ActivityPoint = 10
		rule.DailyLimit = 5
		return db.Save(&rule).Error
	}

	rule = entity.PointRule{
		ActivityType:  activityType,
		Description:   desc,
		ActivityPoint: 10,
		DailyLimit:    5,
	}
	return db.Create(&rule).Error
}

// ---------- CLEANUP: Remove old/unused rules ----------
func CleanUpOldRules(db *gorm.DB) error {
	// Remove old rules replaced by Title Case or removed
	targets := []string{
		"REVIEW_LIKE_RECEIVED",
		"SEED_INIT",
		// "POST_CREATE", "REVIEW_CREATE", "POLL_CREATE", "StarPost" -> will be renamed, not deleted
	}
	if err := db.Where("activity_type IN ?", targets).Delete(&entity.PointRule{}).Error; err != nil {
		return err
	}
	return nil
}

// ---------- SAFE seed: create balance ONLY if not exists ----------
func SeedInitialPointsSafe(db *gorm.DB, initial int) error {
	// Cleanup old rules
	if err := CleanUpOldRules(db); err != nil {
		return err
	}

	// Ensure rules exist
	if err := EnsurePostCreateRule(db); err != nil {
		return err
	}
	if err := EnsureReviewLikeRule(db); err != nil {
		return err
	}
	if err := EnsureReviewCreateRule(db); err != nil {
		return err
	}
	if err := EnsurePollCreateRule(db); err != nil {
		return err
	}
	if err := EnsurePostQualityRule(db); err != nil {
		return err
	}
	if err := EnsurePollVoteRule(db); err != nil {
		return err
	}

	return nil

}