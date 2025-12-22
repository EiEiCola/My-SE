package entity

import (
	

	"gorm.io/gorm"
)
type PollOption struct {
	gorm.Model
	Label     string `json:"label"`      // ข้อความตัวเลือก
	ImgURL    string `json:"img_url"`    // รูปประกอบตัวเลือก (ถ้ามี)
	SortOrder int    `json:"sort_order"` // ลำดับการแสดงผล

	// FK ไปยังโพล
	PollID uint `json:"poll_id"`
	Poll   Poll `gorm:"foreignKey:PollID;references:ID" json:"poll"`

	// ความสัมพันธ์กับการโหวต
	//Votes []PollVote `gorm:"foreignKey:PollOptionID;references:ID" json:"votes"`
	VoteOptions []PollVoteOption `gorm:"foreignKey:PollOptionID;references:ID" json:"vote_options"`	
}	