package entity

import "gorm.io/gorm"

type MemberAccount struct {

gorm.Model

MemberAccountID		int	   `json:"member_account_id"`

Email 				string `json:"email" gorm:"unique"`
Password 			string `json:"password"`

RoleID    			uint   `json:"role_id"`  
Role      			Role   `gorm:"foreignKey:RoleID;references:ID"` 

}