package entity

import (
	"errors"
	"strings"

	"gorm.io/gorm"
)

type PointRule struct {
	gorm.Model

	ActivityType  string `json:"activity_type" gorm:"not null;uniqueIndex"`
	ActivityPoint int    `json:"activity_point" gorm:"not null"`
	DailyLimit    int    `json:"daily_limit" gorm:"not null;default:0"`
}

func ValidatePointRule(p PointRule) (bool, error) {
	if strings.TrimSpace(p.ActivityType) == "" {
		return false, errors.New("ActivityType is required")
	}

	if p.ActivityPoint <= 0 {
		return false, errors.New("ActivityPoint must be greater than 0")
	}

	if p.DailyLimit < 0 {
		return false, errors.New("DailyLimit must be zero or positive")
	}

	return true, nil
}
