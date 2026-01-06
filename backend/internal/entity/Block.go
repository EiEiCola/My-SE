package entity

import (
	"fmt"
	"time"
)
type Block struct {
	ID         int      	`gorm:"column:b_ID;primaryKey" json:"b_id"`
	BlockerID  int    		`gorm:"column:blocker_ID" json:"blocker_id"` // คนที่บล็อก  FK -> Member.m_ID
	BlockedID  int    		`gorm:"column:blocked_ID" json:"blocked_id"` // คนที่ถูกบล็อก FK -> Member.m_ID
	CreatedAt  time.Time 	`gorm:"column:create_at" json:"created_at"`
	Active     bool      	`gorm:"column:active" json:"active"`
	UpdatedAt  time.Time 	`gorm:"column:update_at" json:"updated_at,omitempty"`

	Blocker   *Member   `gorm:"foreignKey:BlockerID;references:ID" json:"blocker"`
	Blocked   *Member   `gorm:"foreignKey:BlockedID;references:ID" json:"blocked"`
}

func ValidateBlock(block Block) (bool, error) {
	if block.BlockerID == 0 {
		return false, fmt.Errorf("Blocker ID is required")
	}
	if block.BlockedID == 0 {
		return false, fmt.Errorf("Blocked ID is required")
	}
	if block.BlockerID == block.BlockedID {
		return false, fmt.Errorf("Cannot block yourself")
	}
	return true, nil
}