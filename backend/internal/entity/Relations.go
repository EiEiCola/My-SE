package entity

import "time"

type Relations struct {
	ID         	int     `gorm:"column:rela_ID;primaryKey" json:"rela_id"`
	Member1_ID  int    	`gorm:"column:member1_ID" json:"member1_id"` // FK -> Member.m_ID
	Member2_ID  int    	`gorm:"column:member2_ID" json:"member2_id"` // FK -> Member.m_ID
	CreatedAt  	time.Time `gorm:"column:create_at" json:"created_at"`
	Active     	bool      `gorm:"column:active" json:"active"`
	UpdatedAt  	time.Time `gorm:"column:update_at" json:"updated_at,omitempty"`

}