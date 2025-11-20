package entity

import "gorm.io/gorm"

type Admin struct {

gorm.Model

Admin 		int    `json:"admin_id"`
FirstName 	string `json:"first_name"`
LastName 	string `json:"last_name"`
Email 		string `json:"email" gorm:"unique"` 

MemberAccountID uint      	  `json:"member_account_id"` 
MemberAccount   MemberAccount `gorm:"foreignKey:MemberAccountID;references:ID"`

}