package entity

import "time"

type RequesFriend struct {
	ID             	int       	`gorm:"column:rf_id;primaryKey;autoIncrement" json:"rf_id"`
	SentMemID		int      	`gorm:"column:sent_mem_id" json:"sent_member_id,omitempty"` // FK -> sendMember.ID
	ReciveMemID     int    		`gorm:"column:receive_mem_id" json:"receive_member_id"`		// FK -> reMember.ID
	CreatedAt      	time.Time 	`gorm:"column:created_at" json:"created_at"`
	RequesStatusID 	int       	`gorm:"column:status" json:"reques_status_id"` 				// FK -> RequesStatus.id
	FinishedAt     	time.Time 	`gorm:"column:finished_at" json:"finished_at,omitempty"`
		
}