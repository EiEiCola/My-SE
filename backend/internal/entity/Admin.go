package entity

import "gorm.io/gorm"

type Admin struct {
  gorm.Model

  Username       string `json:"username" gorm:"uniqueIndex;not null"`

  // ✅ ใช้ยืนยันตอนลืมรหัส (ห้ามเก็บเลขเต็ม)
  NationalIDHash  string `json:"-" gorm:"not null"`
  NationalIDLast4 string `json:"national_id_last4"` // optional

  FirstName      string `json:"first_name"`
  LastName       string `json:"last_name"`
  ProfilePicture string `json:"profile_picture" gorm:"default:''"`
  PhoneNumber    string `json:"phone_number" gorm:"uniqueIndex"`

  MemberAccountID uint          `json:"member_account_id" gorm:"not null;uniqueIndex"`
  MemberAccount   MemberAccount `gorm:"foreignKey:MemberAccountID;references:ID"`

  PollHistorys   []PollHistory  `gorm:"foreignKey:AdminID;references:ID;constraint:false" json:"poll_historys"`
  Announcements  []Announcement `gorm:"foreignKey:AdminID;references:ID;constraint:false" json:"announcements"`
}
