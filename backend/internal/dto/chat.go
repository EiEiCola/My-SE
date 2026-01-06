package dto

import "time"

// Request สำหรับสร้างห้องแชท (Private / Group)
type CreateRoomRequest struct {
	Type        string   `json:"type" binding:"required,oneof=private group"` // private หรือ group
	TargetID    *uint    `json:"target_id"`                                   // กรณี private (คุยกับใคร)
	GroupName   string   `json:"group_name"`                                  // กรณี group
	MemberIDs   []uint   `json:"member_ids"`                                  // สมาชิกเริ่มต้นในกลุ่ม
}

// Request สำหรับส่งข้อความ
type SendMessageRequest struct {
	Content     string             `json:"content"`
	Type        string             `json:"type" binding:"required,oneof=text image file sticker"`
	Attachments []AttachmentRequest `json:"attachments"`
	StickerID   *uint               `json:"sticker_id"`
}

type AttachmentRequest struct {
	FileURL  string `json:"file_url"`
	FileType string `json:"file_type"`
	FileName string `json:"file_name"`
	FileSize string `json:"file_size"`
}

// Response สำหรับหน้ารายการห้องแชท
type RoomListResponse struct {
	RoomID      uint      `json:"room_id"`
	Type        string    `json:"type"`
	Name        string    `json:"name"`
	AvatarURL   string    `json:"avatar_url"`
	LastMessage string    `json:"last_message"`
	LastSentAt  time.Time `json:"last_sent_at"`
	UnreadCount int       `json:"unread_count"`
}