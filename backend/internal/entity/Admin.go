package entity

import "gorm.io/gorm"

type Admin struct {

gorm.Model

AdminID 	int `json:"admin_id"`
FirstName 	string `json:"first_name"`
LastName 	string `json:"last_name"`

MemberAccountID   uint   		`json:"member_account_id"`  
MemberAccount     MemberAccount `gorm:"foreignKey:MemberAccountID;references:ID"`

Rewards         []Reward       `gorm:"-"` 
PollHistorys   	[]PollHistory  `gorm:"-"`
PRReviews       []PRReview     `gorm:"-"` 
Reports         []Report       `gorm:"-"`

    // 5. ปัญหา Announcements
Announcements    []Announcement `gorm:"-"` // ถ้ามีฟิลด์นี้ ต้องเพิ่ม gorm:"-" ด้วย
}

// func (Admin) TableName() string {
//   return "admins_temp_test" // ใช้ชื่อตารางใหม่ที่ไม่เคยมี
// }