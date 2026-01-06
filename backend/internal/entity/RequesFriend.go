package entity

import (
	"fmt"
	"time"
)

type RequesFriend struct {
	ID             	int       	`gorm:"column:rf_id;primaryKey;autoIncrement" json:"rf_id"`
	SentMemID		int      	`gorm:"column:sent_mem_id" json:"sent_member_id,omitempty"` // FK -> sendMember.ID
	ReceiveMemID     int    		`gorm:"column:receive_mem_id" json:"receive_member_id"`		// FK -> reMember.ID
	CreatedAt      	time.Time 	`gorm:"column:created_at" json:"created_at"`
	RequesStatusID 	int       	`gorm:"column:status" json:"reques_status_id"` 				// FK -> RequesStatus.id
	FinishedAt     	time.Time 	`gorm:"column:finished_at" json:"finished_at,omitempty"`
	
	SentMember *Member `gorm:"foreignKey:SentMemID;references:ID" json:"sent_member"`
	ReceiveMember *Member `gorm:"foreignKey:ReceiveMemID;references:ID" json:"receive_member"`
}

func ValidateRequesFriend(req RequesFriend) (bool, error) {
	if req.SentMemID == 0 {
		return false, fmt.Errorf("Sender ID is required")
	}
	if req.ReceiveMemID == 0 {
		return false, fmt.Errorf("Receiver ID is required")
	}
	if req.SentMemID == req.ReceiveMemID {
		return false, fmt.Errorf("Cannot send request to yourself")
	}
	if req.RequesStatusID == 0 {
		return false, fmt.Errorf("Status ID is required")
	}
	if req.CreatedAt.IsZero() {
		return false, fmt.Errorf("CreatedAt is required")
	}
	return true, nil
}