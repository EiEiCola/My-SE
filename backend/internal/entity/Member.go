package entity

import (

    "gorm.io/gorm"
    "time"
)

type Member struct {

    gorm.Model

    FirstName     string `json:"first_name"`
    LastName      string `json:"last_name"`
    Username      string `json:"username" gorm:"unique"`
    Dob           time.Time `json:"dob"`
    Bio           string `json:"bio"`
    MemberPicture string `json:"member_picture"`
    NationalID    string `json:"national_id"`
    StudentID     string `json:"student_id" gorm:"unique"`

    // 1:1 กับ MemberAccount  
    MemberAccount *MemberAccount `gorm:"foreignKey:MemberID;references:ID"`


    GenderID       uint        `json:"gender_id"`
    Gender         Gender       `gorm:"foreignKey:GenderID;references:ID"`

    ActiveStatusID uint         `json:"active_status_id"`
    ActiveStatus   ActiveStatus `gorm:"foreignKey:ActiveStatusID;references:ID"`

    SentRequests     []RequesFriend `gorm:"foreignKey:SentMemID;references:ID"`
    ReceivedRequests []RequesFriend `gorm:"foreignKey:ReciveMemID;references:ID"`

    RelationsAsUser1 []Relations `gorm:"foreignKey:member1_ID;references:ID"`
    RelationsAsUser2 []Relations `gorm:"foreignKey:member2_ID;references:ID"`

    BlocksAsBlocker []Block `gorm:"foreignKey:BlockerID;references:ID"`
    BlocksAsBlocked []Block `gorm:"foreignKey:BlockedID;references:ID"`
}
