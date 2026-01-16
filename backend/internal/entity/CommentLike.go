package entity

import "gorm.io/gorm"

// CommentLike เก็บข้อมูลการกดไลค์คอมเมนต์
type CommentLike struct {
	gorm.Model
	CommentID uint `gorm:"uniqueIndex:idx_comment_member;not null" json:"comment_id"`
	MemberID  uint `gorm:"uniqueIndex:idx_comment_member;not null" json:"member_id"`
}
