package entity

import "gorm.io/gorm"

type Reward struct {

gorm.Model

RewardID		int	   `json:"reward_id"`
RewardName 		string `json:"reward_name"`
PointRequired 	string `json:"point_required"`
RewardPicture	string `json:"reward_picture"`	

AdminID   uint   `json:"admin_id"`  
Admin     Admin  `gorm:"foreignKey:AdminID;references:ID"`

}