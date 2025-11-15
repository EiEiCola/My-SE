package entity

import "gorm.io/gorm"

type Member struct {

gorm.Model

FirstName 	string `json:"first_name"`
LastName 	string `json:"last_name"`
Username	string	`json:"username"`
Email 		string `json:"email"`
Dob		string	`json:"dob"`
Bio		string	`json:"bio"`
MemberPicture	string `json:"member_picture"`
 
GenderID    uint   `json:"gender_id"`  
Gender      Gender `gorm:"foreignKey:GenderID;references:ID"`

ActiveStatusID    uint   `json:"active_status_id"`  
ActiveStatus      ActiveStatus `gorm:"foreignKey:ActiveStatusID;references:ID"`

MemberAccountID   uint   `json:"member_account_id"`  
MemberAccount     MemberAccount `gorm:"foreignKey:MemberAccountID;references:ID"`

}