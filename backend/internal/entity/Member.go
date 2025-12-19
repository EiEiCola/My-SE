package entity

import (
	"time"

	"github.com/asaskevich/govalidator"
	"gorm.io/gorm"
)

type Member struct {
	gorm.Model

	FirstName string `json:"first_name" valid:"required~FirstName is required"`
	LastName  string `json:"last_name" valid:"required~LastName is required"`
	Username  string `json:"username" gorm:"uniqueIndex;not null" valid:"required~Username is required"`

	Dob time.Time `json:"dob" valid:"required~Dob is required"`

	Bio           string `json:"bio"`
	MemberPicture string `json:"member_picture"`

	NationalID string `json:"national_id" gorm:"uniqueIndex;not null" valid:"required~NationalID is required,length(13|13)~NationalID must be 13 digits"`
	StudentID  string `json:"student_id" gorm:"uniqueIndex;not null" valid:"required~StudentID is required"`

	// ✅ 1:1 กับ Account
	MemberAccountID uint `json:"member_account_id" gorm:"not null;uniqueIndex"`
    MemberAccount   *MemberAccount `json:"-" gorm:"foreignKey:MemberAccountID;references:ID"`

	GenderID uint   `json:"gender_id" valid:"required~GenderID is required"`
	Gender   Gender `gorm:"foreignKey:GenderID;references:ID"`

	ActiveStatusID uint         `json:"active_status_id" valid:"required~ActiveStatusID is required"`
	ActiveStatus   ActiveStatus `gorm:"foreignKey:ActiveStatusID;references:ID"`

	SentRequests     []RequesFriend `gorm:"foreignKey:SentMemID;references:ID"`
	ReceivedRequests []RequesFriend `gorm:"foreignKey:ReciveMemID;references:ID"`

	RelationsAsUser1 []Relations `gorm:"foreignKey:member1_ID;references:ID"`
	RelationsAsUser2 []Relations `gorm:"foreignKey:member2_ID;references:ID"`

	BlocksAsBlocker []Block `gorm:"foreignKey:BlockerID;references:ID"`
	BlocksAsBlocked []Block `gorm:"foreignKey:BlockedID;references:ID"`

	Reviews     []Review     `gorm:"foreignKey:MemberID" json:"reviews"`
	ReviewVotes []ReviewVote `gorm:"foreignKey:MemberID" json:"review_votes"`

	Polls []Poll `gorm:"foreignKey:MemberID" json:"polls"`

	PRSubmissions []PRSubmission `gorm:"foreignKey:MemberID" json:"pr_submissions"`

	Reports []Report `gorm:"foreignKey:ReporterID" json:"my_reports"`

	ReceivedReports []Report `gorm:"polymorphic:Target;" json:"received_reports"`
}

func ValidateMember(m Member) (bool, error) {
	return govalidator.ValidateStruct(m)
}
