package entity

import "gorm.io/gorm"

type PointTransaction struct {

gorm.Model

PointTransactionID			int	   `json:"point_transaction_id"`
Point 	string `json:"point"`

MemberAccountID   uint   `json:"member_account_id"`  
MemberAccount     MemberAccount `gorm:"foreignKey:MemberAccountID;references:ID"`

PointRuleID  uint   `json:"point_rule_id"`  
PointRule    PointRule `gorm:"foreignKey:PointRuleID;references:ID"`

}