package entity

import "gorm.io/gorm"

type MemberReward struct {

gorm.Model

MemberRewardID	int		`json:"member_reward_id"`
PointUsed 		int 		`json:"point_used"`

MemberID   				uint   `json:"member_id"`  
Member     				Member `gorm:"foreignKey:MemberID;references:ID"`

RewardID   uint   `json:"reward_id"`  
Reward     Reward `gorm:"foreignKey:RewardID;references:ID"`

}