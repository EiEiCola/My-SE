package entity

import "gorm.io/gorm"

type PointRule struct {
gorm.Model

  ActivityType  string `json:"activity_type" gorm:"not null;uniqueIndex"`
  ActivityPoint int    `json:"activity_point" gorm:"not null"`
  DailyLimit    int    `json:"daily_limit" gorm:"not null;default:0"`
  
}


