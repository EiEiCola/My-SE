package entity

import "gorm.io/gorm"

type Admin struct {
	gorm.Model

	AdminID   int    `json:"admin_id"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`

	MemberAccountID uint          `json:"member_account_id"`
	MemberAccount   MemberAccount `gorm:"foreignKey:MemberAccountID;references:ID"`

	PollHistorys []PollHistory `gorm:"foreignKey:AdminID;references:ID;constraint:false" json:"poll_historys"`

	Announcements []Announcement `gorm:"foreignKey:AdminID;references:ID;constraint:false" json:"announcements"`
}
