package dto

import "time"

// ==========================================
// 1. Requests (รับข้อมูลจาก Frontend)
// ==========================================

// CreateRoomRequest: สำหรับสร้างห้องแชท (POST /chat/rooms)
type CreateRoomRequest struct {
	// Type: ประเภทห้อง ("private" หรือ "group")
	Type string `json:"type" binding:"required,oneof=private group"`

	// TargetID: สำหรับ Private Chat (คุยกับใคร)
	TargetID *uint `json:"target_id"`

	// GroupName: สำหรับ Group Chat (ชื่อกลุ่ม)
	GroupName string `json:"group_name"`

	// MemberIDs: สำหรับ Group Chat (รายชื่อสมาชิกเริ่มต้น ไม่รวมคนสร้าง)
	MemberIDs []uint `json:"member_ids"`
}

// SendMessageRequest: สำหรับส่งข้อความ (POST /chat/rooms/:id/messages)
type SendMessageRequest struct {
	// Content: เนื้อหาข้อความ (Text)
	Content string `json:"content"`

	// Type: ประเภทข้อความ ("text", "image", "file", "sticker")
	Type string `json:"type" binding:"required,oneof=text image file sticker"`

	// StickerID: สำหรับ Sticker (ถ้ามี)
	StickerID *uint `json:"sticker_id"`

	// Attachments: สำหรับไฟล์แนบ (ถ้ามี)
	Attachments []AttachmentRequest `json:"attachments"`
}

// AttachmentRequest: ข้อมูลไฟล์แนบ (ย่อยใน SendMessageRequest)
type AttachmentRequest struct {
	FileURL  string `json:"file_url"`
	FileType string `json:"file_type"`
	FileName string `json:"file_name"`
	FileSize string `json:"file_size"`
}

// ==========================================
// 2. Responses (ส่งข้อมูลกลับ Frontend)
// ==========================================

// RoomListResponse: (Optional) ใช้ map ข้อมูลห้องแชทให้กระชับก่อนส่งกลับ
type RoomListResponse struct {
	RoomID      uint      `json:"room_id"`
	Type        string    `json:"rc_type"`
	Name        string    `json:"rc_name"`      // ชื่อห้อง (ถ้า Private Frontend ต้องไป map ชื่อเพื่อนเอง หรือให้ Backend map ให้)
	AvatarURL   string    `json:"rc_url"`       // รูปห้อง
	LastMessage string    `json:"last_message"` // ข้อความล่าสุด
	UpdatedAt   time.Time `json:"updated_at"`   // เวลาอัปเดตล่าสุด (ใช้เรียงลำดับ)
}

// MemberShortInfo: ข้อมูลย่อของสมาชิก (ใช้แสดงในรายชื่อสมาชิกกลุ่ม หรือหน้าแชท)
// ตรงกับฟิลด์ที่เรา Select ใน Repository: id, first_name, last_name, username, member_picture, student_id, dob
type MemberShortInfo struct {
	ID            uint      `json:"id"`
	FirstName     string    `json:"first_name"`
	LastName      string    `json:"last_name"`
	Username      string    `json:"username"`
	MemberPicture string    `json:"member_picture"`
	StudentID     string    `json:"student_id"`
	Dob           time.Time `json:"dob"`
}
