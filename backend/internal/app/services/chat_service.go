package services

// import (
// 	"errors"
// 	"time"

// 	"github.com/sut68/team12/backend/internal/app/repository"
// 	"github.com/sut68/team12/backend/internal/app/websocket"
// 	"github.com/sut68/team12/backend/internal/dto"
// 	"github.com/sut68/team12/backend/internal/entity"
// )

// type ChatService struct {
// 	repo repository.ChatRepository
// 	hub  *websocket.Hub
// }

// func NewChatService(repo repository.ChatRepository, hub *websocket.Hub) *ChatService {
// 	return &ChatService{repo: repo, hub: hub}
// }

// // ----------------------------------------------------------------
// // 1. CreateRoom: สร้างห้องแชท (Private / Group)
// // ----------------------------------------------------------------
// func (s *ChatService) CreateRoom(req dto.CreateRoomRequest, createdBy uint) (*entity.RoomChat, error) {
// 	// --- กรณี Private (1-1) ---
// 	if req.Type == "private" {
// 		if req.TargetID == nil {
// 			return nil, errors.New("target_id required for private chat")
// 		}

// 		// 1.1 เช็คว่าเคยมีห้องกันหรือยัง ถ้ามีให้ Return ห้องเดิมกลับไปเลย
// 		existing, _ := s.repo.FindPrivateRoom(createdBy, *req.TargetID)
// 		if existing != nil {
// 			return existing, nil
// 		}

// 		// 1.2 ถ้ายังไม่มี ให้สร้างใหม่
// 		newRoom := entity.RoomChat{
// 			Type:      "private",
// 			CreatedBy: int(createdBy),
// 			CreatedAt: time.Now(),
// 		}

// 		// CreateRoom ต้องอัปเดต ID กลับมาที่ newRoom ด้วย (GORM ทำให้)
// 		if err := s.repo.CreateRoom(&newRoom); err != nil {
// 			return nil, err
// 		}

// 		// 1.3 เพิ่มสมาชิก 2 คน (คนสร้าง + คู่สนทนา)
// 		s.repo.AddRoomMember(&entity.RoomMember{RoomID: newRoom.ID, MemberID: createdBy, Role: "member", JoinedAt: time.Now()})
// 		s.repo.AddRoomMember(&entity.RoomMember{RoomID: newRoom.ID, MemberID: *req.TargetID, Role: "member", JoinedAt: time.Now()})

// 		return &newRoom, nil
// 	}

// 	// --- กรณี Group (หลายคน) ---
// 	if req.Type == "group" {
// 		if req.GroupName == "" {
// 			return nil, errors.New("group_name is required")
// 		}

// 		newRoom := entity.RoomChat{
// 			Type:      "group",
// 			Name:      req.GroupName,
// 			CreatedBy: int(createdBy),
// 			CreatedAt: time.Now(),
// 		}

// 		// 2.1 สร้างห้อง
// 		if err := s.repo.CreateRoom(&newRoom); err != nil {
// 			return nil, err
// 		}

// 		// 2.2 เพิ่มคนสร้างเป็น Admin
// 		s.repo.AddRoomMember(&entity.RoomMember{
// 			RoomID:   newRoom.ID,
// 			MemberID: createdBy,
// 			Role:     "admin",
// 			JoinedAt: time.Now(),
// 		})

// 		// 2.3 เพิ่มสมาชิกคนอื่นๆ ตามที่ส่งมา
// 		for _, memberID := range req.MemberIDs {
// 			if memberID == createdBy {
// 				continue
// 			} // ข้ามถ้าซ้ำกับคนสร้าง

// 			s.repo.AddRoomMember(&entity.RoomMember{
// 				RoomID:   newRoom.ID,
// 				MemberID: memberID,
// 				Role:     "member",
// 				JoinedAt: time.Now(),
// 			})
// 		}

// 		return &newRoom, nil
// 	}

// 	return nil, errors.New("invalid room type")
// }

// // ----------------------------------------------------------------
// // 2. SendMessage: ส่งข้อความ + Broadcast WebSocket
// // ----------------------------------------------------------------
// func (s *ChatService) SendMessage(senderID, roomID uint, req dto.SendMessageRequest) (*entity.Message, error) {

// 	// 2.1 เช็คสิทธิ์การใช้ Sticker (ถ้ามี)
// 	if req.Type == "sticker" && req.StickerID != nil {
// 		count, _ := s.repo.CountMemberReward(senderID, *req.StickerID)
// 		if count == 0 {
// 			return nil, errors.New("you do not own this sticker")
// 		}
// 	}

// 	// 2.2 สร้าง Object Message
// 	msg := entity.Message{
// 		RoomID:    roomID,
// 		SenderID:  senderID,
// 		Content:   req.Content,
// 		Type:      req.Type,
// 		StickerID: req.StickerID,
// 		SentAt:    time.Now(),
// 		IsDeleted: false,
// 	}

// 	// 2.3 บันทึกลง Database
// 	if err := s.repo.CreateMessage(&msg); err != nil {
// 		return nil, err
// 	}

// 	// 2.4 ส่ง Real-time ผ่าน WebSocket (Broadcast)
// 	// ตรวจสอบว่าใน package websocket มี const EventMessage หรือไม่ ถ้าไม่มีให้ใช้ string "new_message"
// 	s.hub.Broadcast <- websocket.WSMessage{
// 		Type:    "new_message", // หรือ websocket.EventMessage
// 		Payload: msg,
// 		RoomID:  roomID,
// 		// Optional: ส่งไปเผื่อ Frontend อยากรู้ว่าใครส่ง (แม้จะมีใน payload แล้ว)
// 	}

// 	return &msg, nil
// }

// // ----------------------------------------------------------------
// // 3. GetMyRooms: ดึงรายการห้องแชทของฉัน
// // ----------------------------------------------------------------
// func (s *ChatService) GetMyRooms(memberID uint) ([]entity.RoomChat, error) {
// 	return s.repo.GetMyRooms(memberID)
// }

// // ----------------------------------------------------------------
// // 4. GetRoomHistory: ดึงประวัติแชท
// // ----------------------------------------------------------------
// func (s *ChatService) GetRoomHistory(userID, roomID uint) ([]entity.Message, error) {
// 	// *ควรมี Logic เช็คว่า userID เป็นสมาชิกห้อง roomID หรือไม่ ก่อนดึงข้อมูล*
// 	return s.repo.GetRoomMessages(userID, roomID)
// }

// // ----------------------------------------------------------------
// // 5. UnsendMessage: ยกเลิกข้อความ
// // ----------------------------------------------------------------
// func (s *ChatService) UnsendMessage(userID, messageID uint) error {
// 	msg, err := s.repo.GetMessageByID(messageID)
// 	if err != nil {
// 		return err
// 	}

// 	// 5.1 เช็คสิทธิ์เจ้าของข้อความ
// 	if msg.SenderID != userID {
// 		return errors.New("not authorized")
// 	}

// 	// 5.2 เช็คเวลา (ไม่เกิน 10 นาที)
// 	if time.Since(msg.SentAt) > 10*time.Minute {
// 		return errors.New("cannot unsend message older than 10 minutes")
// 	}

// 	// 5.3 Soft Delete / Update Content
// 	msg.IsDeleted = true
// 	msg.Content = "This message was unsent"

// 	if err := s.repo.UnsendMessage(msg); err != nil {
// 		return err
// 	}

// 	// 5.4 แจ้งเตือนทุกคนในห้องว่าข้อความนี้ถูกลบแล้ว
// 	s.hub.Broadcast <- websocket.WSMessage{
// 		Type:    "message_update",
// 		Payload: msg,
// 		RoomID:  msg.RoomID,
// 	}
// 	return nil
// }

// // ----------------------------------------------------------------
// // 6. ClearChatHistory: ลบประวัติแชท (ฝั่งตัวเอง)
// // ----------------------------------------------------------------
// func (s *ChatService) ClearChatHistory(userID, roomID uint) error {
// 	return s.repo.ClearChatHistory(userID, roomID)
// }
