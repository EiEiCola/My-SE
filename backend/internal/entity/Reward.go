package entity

import (
	"errors"
	"strings"

	"gorm.io/gorm"
)

type Reward struct {
	gorm.Model

	RewardName    string `json:"reward_name" gorm:"not null"`
	PointRequired int    `json:"point_required" gorm:"not null"`
	RewardPicture string `json:"reward_picture" gorm:"type:text"`

	AdminID uint          `json:"admin_id" gorm:"not null;index"`
	Admin   MemberAccount `json:"admin,omitempty" gorm:"foreignKey:AdminID;references:ID" valid:"-"`
}

func ValidateReward(r Reward) (bool, error) {
	if strings.TrimSpace(r.RewardName) == "" {
		return false, errors.New("RewardName is required")
	}

	if r.PointRequired <= 0 {
		return false, errors.New("PointRequired must be greater than 0")
	}

	if r.AdminID == 0 {
		return false, errors.New("AdminID is required")
	}

	return true, nil
}
