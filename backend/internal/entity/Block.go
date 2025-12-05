package entity

import "time"

type Block struct {
	ID         int       `gorm:"column:b_ID;primaryKey" json:"b_id"`
	BlockerID  int    `gorm:"column:blocker_ID" json:"blocker_id"` // คนที่บล็อก  FK -> Member.m_ID
	BlockedID  int    `gorm:"column:blocked_ID" json:"blocked_id"` // คนที่ถูกบล็อก FK -> Member.m_ID
	CreatedAt  time.Time `gorm:"column:create_at" json:"created_at"`
	Active     bool      `gorm:"column:active" json:"active"`
	UpdatedAt  time.Time `gorm:"column:update_at" json:"updated_at,omitempty"`
}