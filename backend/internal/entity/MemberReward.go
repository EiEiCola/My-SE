package entity

import "gorm.io/gorm"

type MemberReward struct {

gorm.Model

MemberRewardID	int		`json:"member_reward_id"`
PointUsed 		int 		`json:"point_used"`

MemberAccountID   uint   `json:"member_account_id"`  
MemberAccount     MemberAccount `gorm:"foreignKey:MemberAccountID;references:ID"`

RewardID   uint   `json:"reward_id"`  
Reward     Reward `gorm:"foreignKey:RewardID;references:ID"`

}