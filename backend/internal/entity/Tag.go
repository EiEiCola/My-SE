package entity

import
 (
	"time"
	"gorm.io/gorm"
)

type Tag struct {
	gorm.Model
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`



}