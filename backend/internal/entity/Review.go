package entity

import (
	"gorm.io/gorm"
	"time"
)
type Review struct {
	gorm.Model
	Title           string    `json:"title"`
	Content         string    `json:"content"`
	Rating          int       `json:"rating"`
	IsAnonymous     bool      `json:"is_anonymous"`
	HelpfulCount    int       `json:"helpful_count"`
	NotHelpfulCount int       `json:"not_helpful_count"`
	CreatedAt       time.Time `json:"created_at"`


}

