package dataseed

import (
	"log"

	"github.com/sut68/team12/backend/internal/entity"
	"gorm.io/gorm"
)

func SeedRewards(db *gorm.DB) {
	// Find the admin account ID to associate rewards with
	var adminAccount entity.MemberAccount
	err := db.Where("role_id = ?", 1).First(&adminAccount).Error
	if err != nil {
		log.Println("❌ SeedRewards: Admin account not found, skipping reward seeding.")
		return
	}

	// -----------------------------------------------------
	// 🧹 CLEANUP: Remove old generic rewards (User requested)
	// -----------------------------------------------------
	oldRewards := []string{
		"ส่วนลด 50 บาท (Discount 50 THB)",
		"แก้วน้ำฟรี (Free Mug)",
		"บัตรชมภาพยนตร์ (Movie Ticket)",
		"Starbucks Card 100 THB",
		"Murv Murv",  // Remove cloud
		"Saddy Star", // Remove star
		"Koala",      // Remove Koala
		"Phoenix",    // Remove Phoenix and replace with Dinosaur
	}
	// Hard delete or Soft delete depending on preference. Using Delete (Soft Delete) is safer but keeps them in DB.
	// User said "Cut out", Unscoped().Delete() effectively removes them (or soft delete if model has deleted_at).
	// entity.Reward has gorm.Model so it has DeletedAt.
	// We'll use soft delete (standard Gorm Delete).
	if err := db.Where("reward_name IN ?", oldRewards).Delete(&entity.Reward{}).Error; err != nil {
		log.Println("⚠️ SeedRewards: Failed to invoke cleanup on old rewards:", err)
	} else {
		log.Println("🧹 SeedRewards: Cleanup old generic rewards completed.")
	}

	rewards := []entity.Reward{
		{
			RewardName:    "Tammy",
			PointRequired: 20,
			RewardPicture: "https://cdn-icons-png.flaticon.com/512/616/616408.png", // Cute Cat
			AdminID:       adminAccount.ID,
		},
		{
			RewardName:    "Llama", // Renamed from Drunk
			PointRequired: 20,
			RewardPicture: "https://cdn-icons-png.flaticon.com/512/2395/2395796.png", // Llama
			AdminID:       adminAccount.ID,
		},
		{
			RewardName:    "Puppy", // Replaced Murv Murv
			PointRequired: 20,
			RewardPicture: "https://cdn-icons-png.flaticon.com/512/616/616430.png", // Dog
			AdminID:       adminAccount.ID,
		},
		{
			RewardName:    "loona",
			PointRequired: 25,
			RewardPicture: "https://cdn-icons-png.flaticon.com/512/826/826963.png", // Bunny
			AdminID:       adminAccount.ID,
		},
		{
			RewardName:    "Baby Munic",
			PointRequired: 25,
			RewardPicture: "https://cdn-icons-png.flaticon.com/512/1998/1998767.png", // Monkey
			AdminID:       adminAccount.ID,
		},
		{
			RewardName:    "Foxy", // Replaced Saddy Star
			PointRequired: 25,
			RewardPicture: "https://cdn-icons-png.flaticon.com/512/616/616410.png", // Fox
			AdminID:       adminAccount.ID,
		},
		{
			RewardName:    "Chicky",
			PointRequired: 30,
			RewardPicture: "https://cdn-icons-png.flaticon.com/512/1864/1864514.png", // Chicken
			AdminID:       adminAccount.ID,
		},
		{
			RewardName:    "Panda",
			PointRequired: 30,
			RewardPicture: "https://cdn-icons-png.flaticon.com/512/3069/3069172.png", // Panda
			AdminID:       adminAccount.ID,
		},
		{
			RewardName:    "Froggy",
			PointRequired: 30,
			RewardPicture: "https://cdn-icons-png.flaticon.com/512/3069/3069186.png", // Frog
			AdminID:       adminAccount.ID,
		},
		{
			RewardName:    "Tiger",
			PointRequired: 35,
			RewardPicture: "https://cdn-icons-png.flaticon.com/512/3069/3069273.png", // Tiger
			AdminID:       adminAccount.ID,
		},
		{
			RewardName:    "Piggy",
			PointRequired: 35,
			RewardPicture: "https://cdn-icons-png.flaticon.com/512/3069/3069201.png", // Pig
			AdminID:       adminAccount.ID,
		},
		{
			RewardName:    "Lion",
			PointRequired: 40,
			RewardPicture: "https://cdn-icons-png.flaticon.com/512/616/616412.png", // Lion
			AdminID:       adminAccount.ID,
		},
		{
			RewardName:    "Penguin",
			PointRequired: 40,
			RewardPicture: "https://cdn-icons-png.flaticon.com/512/616/616428.png", // Penguin
			AdminID:       adminAccount.ID,
		},
		{
			RewardName:    "Elephant",
			PointRequired: 40,
			RewardPicture: "https://cdn-icons-png.flaticon.com/512/616/616432.png", // Elephant
			AdminID:       adminAccount.ID,
		},
		{
			RewardName:    "Owl",
			PointRequired: 45,
			RewardPicture: "https://cdn-icons-png.flaticon.com/512/616/616418.png", // Owl
			AdminID:       adminAccount.ID,
		},
		{
			RewardName:    "Bee",
			PointRequired: 45,
			RewardPicture: "https://cdn-icons-png.flaticon.com/512/616/616556.png", // Bee
			AdminID:       adminAccount.ID,
		},
		{
			RewardName:    "Hamster",
			PointRequired: 45,
			RewardPicture: "https://cdn-icons-png.flaticon.com/512/616/616446.png", // Hamster
			AdminID:       adminAccount.ID,
		},
		{
			RewardName:    "Peacock",
			PointRequired: 40,
			RewardPicture: "https://cdn-icons-png.flaticon.com/512/616/616568.png", // Peacock
			AdminID:       adminAccount.ID,
		},
		{
			RewardName:    "Unicorn",
			PointRequired: 50,
			RewardPicture: "https://cdn-icons-png.flaticon.com/512/616/616558.png", // Unicorn
			AdminID:       adminAccount.ID,
		},
		{
			RewardName:    "Mermaid",
			PointRequired: 55,
			RewardPicture: "https://cdn-icons-png.flaticon.com/512/826/826958.png", // Mermaid
			AdminID:       adminAccount.ID,
		},
		{
			RewardName:    "Dragon",
			PointRequired: 60,
			RewardPicture: "https://cdn-icons-png.flaticon.com/512/616/616524.png", // Dragon
			AdminID:       adminAccount.ID,
		},
		{
			RewardName:    "Dinosaur",
			PointRequired: 65,
			RewardPicture: "https://cdn-icons-png.flaticon.com/512/616/616552.png", // Dinosaur/T-Rex
			AdminID:       adminAccount.ID,
		},
		{
			RewardName:    "Pegasus",
			PointRequired: 70,
			RewardPicture: "https://cdn-icons-png.flaticon.com/512/616/616550.png", // Pegasus
			AdminID:       adminAccount.ID,
		},
	}

	for _, r := range rewards {
		var existing entity.Reward
		// Check if reward already exists by name
		if err := db.Where("reward_name = ?", r.RewardName).First(&existing).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				// Create new reward
				if err := db.Create(&r).Error; err != nil {
					log.Printf("❌ SeedRewards: Failed to create reward '%s': %v\n", r.RewardName, err)
				} else {
					log.Printf("✅ SeedRewards: Created reward '%s'\n", r.RewardName)
				}
			} else {
				log.Printf("❌ SeedRewards: Error checking reward '%s': %v\n", r.RewardName, err)
			}
		} else {
			log.Printf("ℹ️ SeedRewards: Reward '%s' already exists.\n", r.RewardName)
		}
	}
}
