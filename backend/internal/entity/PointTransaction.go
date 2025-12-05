package entity

import "gorm.io/gorm"

type PointTransaction struct {

gorm.Model

PointTransactionID	int	   `json:"point_transaction_id"`
Point 				int 	`json:"point"`

MemberID   			uint   `json:"member_id"`  
Member     			Member `gorm:"foreignKey:MemberID;references:ID"`

PointRuleID  		uint   `json:"point_rule_id"`  
PointRule    		PointRule `gorm:"foreignKey:PointRuleID;references:ID"`

PostID  			uint   `json:"post_id"`  
Post    			Post 	`gorm:"foreignKey:PostID;references:ID"`

PollID  			uint   `json:"poll_id"`  
Poll    			Poll	`gorm:"foreignKey:PollID;references:ID"`

ReviewID  			uint   `json:"review_id"`  
Review    			Review `gorm:"foreignKey:ReviewID;references:ID"`


}