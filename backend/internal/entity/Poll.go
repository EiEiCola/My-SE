package entity

import (
	"time"

	"gorm.io/gorm"
)	

type Poll struct {
	gorm.Model
	Question         string     `json:"question"`           // คำถามของโพล
	AllowMultiple    bool       `json:"allow_multiple"`     // อนุญาตเลือกได้หลายตัวเลือกไหม
	MaxChoice        *int       `json:"max_choice"`         // ถ้า AllowMultiple = true จะใช้กำหนดจำนวนสูงสุด
	StartAt          *time.Time `json:"start_at"`           // เวลาเริ่มโหวต
	EndAt            *time.Time `json:"end_at"`             // เวลาสิ้นสุดโหวต
	LastRejectReason string     `json:"last_reject_reason"` // เหตุผลที่ล่าสุดถูก reject (ถ้ามี)

	// FK ไปยังคนสร้างโพล (สมาชิก)
	MemberID uint    `json:"member_id"`
	Member   *Member `gorm:"foreignKey:MemberID;references:ID" json:"member"`

	// FK ไปยังหมวดหมู่ (ใช้หมวดเดียวกับระบบรีวิว / category หลักของระบบ)
	MainCategoryID *uint         `json:"maincategory_id"`
	MainCategory   MainCategory `gorm:"foreignKey:MainCategoryID" json:"main_category"`

	SubCategoryL1ID *uint          `json:"subcategoryl1_id"`
	SubCategoryL1   SubCategoryL1 `gorm:"foreignKey:SubCategoryL1ID;references:ID" json:"subcategory_l1"`

	SubCategoryL2ID *uint          `json:"subcategoryl2_id"`
	SubCategoryL2   SubCategoryL2 `gorm:"foreignKey:SubCategoryL2ID;references:ID" json:"subcategory_l2"`

	// FK ไปยังสถานะของโพล เช่น DRAFT, PENDING_REVIEW, PUBLISHED, REJECTED
	PollStatusID uint        `json:"poll_status_id"`
	PollStatus   *PollStatus `gorm:"foreignKey:PollStatusID;references:ID" json:"status"` //ใส่ pointer เพื่อรองรับกรณีที่ status ยังไม่ถูก preload หรือเป็น null

	// ความสัมพันธ์กับตารางอื่น ๆ
	Options   []PollOption  `gorm:"foreignKey:PollID;references:ID" json:"options"`
	Votes     []PollVote    `gorm:"foreignKey:PollID;references:ID" json:"votes"`
	Histories []PollHistory `gorm:"foreignKey:PollID;references:ID" json:"histories"`
}
