package entity

import "gorm.io/gorm"
import "time"

type Member struct {

gorm.Model

MemberID 	int `json:"member_id"`
FirstName 	string `json:"first_name"`
LastName 	string `json:"last_name"`
Username	string	`json:"username"`

// ตัด Email ออก ให้อยู่แค่ในตาราง MemberAccount 

Dob				time.Time	`json:"dob"`
Bio				string		`json:"bio"`
MemberPicture	string 		`json:"member_picture"`
NationalID		string 		`json:"national_id"`
StudentID		string 		`json:"student_id"`
 
GenderID    uint   `json:"gender_id"`  
Gender      Gender `gorm:"foreignKey:GenderID;references:ID"`

ActiveStatusID    uint   		`json:"active_status_id"`  
ActiveStatus      ActiveStatus `gorm:"foreignKey:ActiveStatusID;references:ID"`

MemberAccountID   uint   		`json:"member_account_id"`  
MemberAccount     MemberAccount `gorm:"foreignKey:MemberAccountID;references:ID"`

}