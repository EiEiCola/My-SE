package entity

import (
	"fmt"
	"time"
)
type Relations struct {
	ID         	int     `gorm:"column:rela_ID;primaryKey" json:"rela_id"`
	Member1_ID  int    	`gorm:"column:member1_ID" json:"member1_ID"` // FK -> Member.m_ID
	Member2_ID  int    	`gorm:"column:member2_ID" json:"member2_ID"` // FK -> Member.m_ID
	CreatedAt  	time.Time `gorm:"column:create_at" json:"created_at"`
	Active     	bool      `gorm:"column:active" json:"active"`
	UpdatedAt  	time.Time `gorm:"column:update_at" json:"updated_at,omitempty"`

	Member1    *Member   `gorm:"foreignKey:Member1_ID;references:ID" json:"member1"`
	Member2    *Member   `gorm:"foreignKey:Member2_ID;references:ID" json:"member2"`

}

func ValidateRelations(rel Relations) (bool, error) {
	if rel.Member1_ID == 0 {
		return false, fmt.Errorf("Member1 ID is required")
	}
	if rel.Member2_ID == 0 {
		return false, fmt.Errorf("Member2 ID is required")
	}
	if rel.Member1_ID == rel.Member2_ID {
		return false, fmt.Errorf("A member cannot be in a relation with themselves")
	}
	// ตรวจสอบวันที่สร้าง (กรณีสร้างใหม่ต้องมีค่า)
	if rel.CreatedAt.IsZero() {
		return false, fmt.Errorf("CreatedAt is required")
	}
	return true, nil
}