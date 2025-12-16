package entity

import "gorm.io/gorm"

type Reward struct {
	gorm.Model

	RewardName    string `json:"reward_name"`
	PointRequired int    `json:"point_required"`
	RewardPicture string `json:"reward_picture" gorm:"type:text"` 

	AdminID uint  `json:"admin_id"`
	Admin   Admin `gorm:"foreignKey:AdminID;references:ID"`
}
