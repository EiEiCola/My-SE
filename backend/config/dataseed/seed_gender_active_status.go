package dataseed

import (
	"log"

	"github.com/sut68/team12/backend/internal/entity"
	"gorm.io/gorm"
)

func SeedGender(db *gorm.DB) {
	genders := []entity.Gender{
		{Model: gorm.Model{ID: 1}, GenderName: "Male"},
		{Model: gorm.Model{ID: 2}, GenderName: "Female"},
		{Model: gorm.Model{ID: 3}, GenderName: "Other"},
	}

	for _, g := range genders {
		if err := db.Where("id = ?", g.ID).FirstOrCreate(&g).Error; err != nil {
			log.Printf("Error seeding gender '%s': %v\n", g.GenderName, err)
		}
	}
	log.Println("✅ Gender seeded")
}

func SeedActiveStatus(db *gorm.DB) {
	statuses := []entity.ActiveStatus{
		{ActiveStatusID: 1, ActiveStatusName: "online"},
		{ActiveStatusID: 2, ActiveStatusName: "offline"},
	}

	for _, s := range statuses {
		// Use ActiveStatusID as the primary lookup if it's meant to be the ID,
		// but entity.ActiveStatus also has gorm.Model.
		// Looking at entity/ActiveStatus.go:
		// type ActiveStatus struct {
		//    gorm.Model
		//    ActiveStatusID   int
		//    ActiveStatusName string
		// }
		// Usually gorm.Model has ID. Let's match ActiveStatusID to ID for consistency if desired.

		s.ID = uint(s.ActiveStatusID)
		if err := db.Where("id = ?", s.ID).FirstOrCreate(&s).Error; err != nil {
			log.Printf("Error seeding active status '%s': %v\n", s.ActiveStatusName, err)
		}
	}
	log.Println("✅ ActiveStatus seeded")
}
