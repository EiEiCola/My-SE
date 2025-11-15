package entity

import "gorm.io/gorm"

type MemberReward struct {

gorm.Model

PointUsed 	string `json:"point_used"`

MemberAccountID   uint   `json:"member_account_id"`  
MemberAccount     MemberAccount `gorm:"foreignKey:MemberAccountID;references:ID"`

RewardID   uint   `json:"reward_id"`  
Reward     Reward `gorm:"foreignKey:RewardID;references:ID"`

}