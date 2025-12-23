package entity

import "gorm.io/gorm"

type Bookmark struct {
	gorm.Model
	MemberID uint   `json:"member_id" gorm:"not null;index:idx_member_post,unique"`
	PostID   uint   `json:"post_id" gorm:"not null;index:idx_member_post,unique"`
	Member   Member `gorm:"foreignKey:MemberID"`
	Post     Post   `gorm:"foreignKey:PostID"`
}
