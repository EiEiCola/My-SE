package entity

import (
	"gorm.io/gorm"
)

type PollHistory struct {
	gorm.Model
	Action string `json:"action"` // SUBMIT, APPROVE, REJECT, UNPUBLISH ฯลฯ
	Reason string `json:"reason"` // เหตุผล (ตอน REJECT / UNPUBLISH)
	//CreatedAt time.Time `json:"created_at"` // เวลา log (ถ้าไม่ใช้ของ gorm.Model)

	// สถานะเดิม → สถานะใหม่
	FromStatusID *uint       `json:"from_status_id"`
	FromStatus   *PollStatus `gorm:"foreignKey:FromStatusID;references:ID;constraint:false" json:"from_status"`

	ToStatusID *uint       `json:"to_status_id"`
	ToStatus   *PollStatus `gorm:"foreignKey:ToStatusID;references:ID;constraint:false" json:"to_status"`

	// โพลที่เกี่ยวข้อง
	PollID uint `json:"poll_id"`
	Poll   Poll `gorm:"foreignKey:PollID;references:ID;constraint:false" json:"poll"`

	// แอดมินที่ตรวจ / อนุมัติ / ปฏิเสธ
	AdminID *uint  `json:"admin_id"`
	Admin   *Admin `gorm:"foreignKey:AdminID;references:ID;constraint:false" json:"admin"`
}
