package entity

import "gorm.io/gorm"

type PostStar struct {
	gorm.Model
	MemberID uint   `json:"member_id" gorm:"not null;index:idx_member_post_star,unique"`
	PostID   uint   `json:"post_id" gorm:"not null;index:idx_member_post_star,unique"`
	Member   Member `gorm:"foreignKey:MemberID"`
	Post     Post   `gorm:"foreignKey:PostID"`
}
