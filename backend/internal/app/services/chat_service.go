package services

import (
	"errors"
	"time"

	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/app/websocket"
	"github.com/sut68/team12/backend/internal/dto"
	"github.com/sut68/team12/backend/internal/entity"
)

type ChatService struct {
	repo       repository.ChatRepository
	friendRepo *repository.FriendRepository
	hub        *websocket.Hub
}

func NewChatService(repo repository.ChatRepository, friendRepo *repository.FriendRepository, hub *websocket.Hub) *ChatService {
	return &ChatService{repo: repo, friendRepo: friendRepo, hub: hub}
}

// ----------------------------------------------------------------
// Helper: Resolve Member ID
// ----------------------------------------------------------------
func (s *ChatService) GetMemberIDByAccountID(accountID uint) (uint, error) {
	return s.repo.GetMemberIDByAccountID(accountID)
}

// ----------------------------------------------------------------
// 1. CreateRoom: สร้างห้องแชท (Private / Group)
// ----------------------------------------------------------------
func (s *ChatService) CreateRoom(req dto.CreateRoomRequest, createdBy uint) (*entity.RoomChat, error) {

	// --- กรณี Private (1-1) ---
	if req.Type == "private" {
		if req.TargetID == nil {
			return nil, errors.New("target_id required for private chat")
		}

		// 1.1 เช็ค Block
		isBlocked, _ := s.friendRepo.IsBlocked(int(createdBy), int(*req.TargetID))
		if isBlocked {
			return nil, errors.New("cannot create chat: you are blocked or you blocked this user")
		}

		// 1.2 เช็คห้องเดิม
		existing, _ := s.repo.FindPrivateRoom(createdBy, *req.TargetID)
		if existing != nil {
			return existing, nil
		}

		// 1.3 สร้างห้องใหม่
		newRoom := entity.RoomChat{
			Type:      "private",
			CreatedBy: int(createdBy),
			CreatedAt: time.Now(),
		}

		if err := s.repo.CreateRoom(&newRoom); err != nil {
			return nil, err
		}

		// 1.4 เพิ่มสมาชิก
		s.repo.AddRoomMember(&entity.RoomMember{RoomID: newRoom.ID, MemberID: createdBy, Role: "member", JoinedAt: time.Now()})
		s.repo.AddRoomMember(&entity.RoomMember{RoomID: newRoom.ID, MemberID: *req.TargetID, Role: "member", JoinedAt: time.Now()})

		return s.repo.GetRoomByID(newRoom.ID)
	}

	// --- กรณี Group (หลายคน) ---
	if req.Type == "group" {
		if req.GroupName == "" {
			return nil, errors.New("group_name is required")
		}

		newRoom := entity.RoomChat{
			Type:      "group",
			Name:      req.GroupName,
			CreatedBy: int(createdBy),
			CreatedAt: time.Now(),
		}

		if err := s.repo.CreateRoom(&newRoom); err != nil {
			return nil, err
		}

		// เพิ่ม Admin
		s.repo.AddRoomMember(&entity.RoomMember{
			RoomID:   newRoom.ID,
			MemberID: createdBy,
			Role:     "admin",
			JoinedAt: time.Now(),
		})

		// เพิ่มสมาชิก
		for _, memberID := range req.MemberIDs {
			if memberID == createdBy {
				continue
			}
			s.repo.AddRoomMember(&entity.RoomMember{
				RoomID:   newRoom.ID,
				MemberID: memberID,
				Role:     "member",
				JoinedAt: time.Now(),
			})
		}

		// ดึงข้อมูลห้องพร้อมสมาชิก
		fullRoom, err := s.repo.GetRoomByID(newRoom.ID)
		if err != nil {
			return nil, err
		}

		// Broadcast ห้องใหม่ไปหาสมาชิกทุกคน (Real-time)
		// ⚠️ ไม่ส่งให้คนสร้าง เพราะเขาได้จาก API response แล้ว
		var targetIDs []uint
		for _, memberID := range req.MemberIDs {
			if memberID != createdBy {
				targetIDs = append(targetIDs, memberID)
			}
		}

		// Broadcast เฉพาะถ้ามีสมาชิกอื่นนอกจากคนสร้าง
		if len(targetIDs) > 0 {
			s.hub.TargetedBroadcast <- websocket.WSMessageWithTargets{
				TargetIDs: targetIDs,
				Msg: websocket.WSMessage{
					Type:    "room_created",
					Payload: fullRoom,
					RoomID:  newRoom.ID,
				},
			}
		}

		return fullRoom, nil
	}

	return nil, errors.New("invalid room type")
}

// ----------------------------------------------------------------
// 2. SendMessage: ส่งข้อความ + Broadcast
// ----------------------------------------------------------------
func (s *ChatService) SendMessage(senderID, roomID uint, req dto.SendMessageRequest) (*entity.Message, error) {

	// 1. Validation: เช็คสิทธิ์ Sticker
	if req.Type == "sticker" {
		if req.StickerID == nil {
			return nil, errors.New("sticker_id is required")
		}
		count, err := s.repo.CountMemberReward(senderID, *req.StickerID)
		if err != nil {
			return nil, err
		}
		if count == 0 {
			return nil, errors.New("you do not own this sticker")
		}
	}

	// 2. สร้าง Object Message
	msg := entity.Message{
		RoomID:    roomID,
		SenderID:  senderID,
		Content:   req.Content,
		Type:      req.Type,
		StickerID: req.StickerID,
		SentAt:    time.Now(),
		IsDeleted: false,
	}

	// 3. บันทึก
	if err := s.repo.CreateMessage(&msg); err != nil {
		return nil, err
	}

	// 3.1 บันทึก Attachments (ถ้ามี)
	if len(req.Attachments) > 0 {
		for _, att := range req.Attachments {
			attachment := entity.AttachmentChat{
				MessageID: msg.ID,
				FileURL:   att.FileURL,
				FileType:  att.FileType,
				FileName:  att.FileName,
				FileSize:  att.FileSize,
			}
			s.repo.CreateAttachment(&attachment)
		}
	}

	// 4. ดึงข้อมูลเต็ม (พร้อมรูปโปรไฟล์/สติ๊กเกอร์)
	fullMsg, err := s.repo.GetMessageByID(msg.ID)
	if err != nil {
		fullMsg = &msg // Fallback
	}

	// 5. Create Message Status (Unread) for all other members
	members, _ := s.repo.GetRoomMembers(roomID)
	var statuses []entity.MessageStatus
	var targetIDs []uint

	for _, m := range members {
		// Prepare target IDs for broadcast
		targetIDs = append(targetIDs, uint(m.MemberID))

		// Create status for recipients (exclude sender)
		if uint(m.MemberID) != senderID {
			statuses = append(statuses, entity.MessageStatus{
				MessageID:   msg.ID,
				RecipientID: uint(m.MemberID), // Recipient
				Status:      "unread",
				CreatedAt:   time.Now(),
			})
		}
	}

	if len(statuses) > 0 {
		s.repo.CreateMessageStatuses(statuses)
	}

	// 6. Broadcast (Targeted)

	s.hub.TargetedBroadcast <- websocket.WSMessageWithTargets{
		TargetIDs: targetIDs,
		Msg: websocket.WSMessage{
			Type:     "new_message",
			Payload:  fullMsg,
			RoomID:   roomID,
			SenderID: senderID,
		},
	}

	return fullMsg, nil
}

// ----------------------------------------------------------------
// 3. GetMyRooms: ดึงรายการห้องแชทของฉัน
// ----------------------------------------------------------------
func (s *ChatService) GetMyRooms(memberID uint) ([]entity.RoomChat, error) {
	return s.repo.GetMyRooms(memberID)
}

// ----------------------------------------------------------------
// 4. GetRoomHistory: ดึงประวัติแชท
// ----------------------------------------------------------------
func (s *ChatService) GetRoomHistory(userID, roomID uint) ([]entity.Message, error) {
	return s.repo.GetRoomMessages(userID, roomID)
}

// ----------------------------------------------------------------
// 5. GetRoomMembers: ดูสมาชิกในห้อง
// ----------------------------------------------------------------
func (s *ChatService) GetRoomMembers(roomID uint) ([]entity.RoomMember, error) {
	return s.repo.GetRoomMembers(roomID)
}

// ----------------------------------------------------------------
// 7. ClearChatHistory: ล้างประวัติแชท
// ----------------------------------------------------------------
func (s *ChatService) ClearChatHistory(userID, roomID uint) error {
	return s.repo.ClearChatHistory(userID, roomID)
}

// ----------------------------------------------------------------
// 8. UnsendMessage: ยกเลิกข้อความ
// ----------------------------------------------------------------
func (s *ChatService) UnsendMessage(userID, messageID uint) error {
	msg, err := s.repo.GetMessageByID(messageID)
	if err != nil {
		return err
	}

	// เช็คสิทธิ์
	if msg.SenderID != userID {
		return errors.New("not authorized to unsend this message")
	}

	// เช็คเวลา (10 นาที)
	if time.Since(msg.SentAt) > 10*time.Minute {
		return errors.New("cannot unsend message older than 10 minutes")
	}

	// Update Content
	msg.IsDeleted = true
	msg.Content = "This message was unsent"

	if err := s.repo.UnsendMessage(msg); err != nil {
		return err
	}

	// Broadcast Update (Targeted)
	members, _ := s.repo.GetRoomMembers(msg.RoomID)
	var targetIDs []uint
	for _, m := range members {
		targetIDs = append(targetIDs, uint(m.MemberID))
	}

	s.hub.TargetedBroadcast <- websocket.WSMessageWithTargets{
		TargetIDs: targetIDs,
		Msg: websocket.WSMessage{
			Type:     "message_update",
			Payload:  msg,
			RoomID:   msg.RoomID,
			SenderID: userID,
		},
	}
	return nil
}

// ----------------------------------------------------------------
// 4. Mark Read
// ----------------------------------------------------------------
func (s *ChatService) MarkMessagesAsRead(userID, roomID uint) error {
	return s.repo.MarkMessagesAsRead(userID, roomID)
}

// ----------------------------------------------------------------
// 6. Sticker Ownership
// ----------------------------------------------------------------
func (s *ChatService) GetMyStickers(memberID uint) ([]entity.MemberReward, error) {
	return s.repo.GetOwnedRewards(memberID)
}

func (s *ChatService) GetRoomByID(roomID uint) (*entity.RoomChat, error) {
	return s.repo.GetRoomByID(roomID)
}

// internal/app/services/chat_service.go

// CreateGroupRoom: สร้างห้องแชทแบบกลุ่ม
func (s *ChatService) CreateGroupRoom(req dto.CreateRoomRequest, createdBy uint) (*entity.RoomChat, error) {

	// 1. Validation
	if req.GroupName == "" {
		return nil, errors.New("group_name is required")
	}
	if len(req.MemberIDs) == 0 {
		return nil, errors.New("at least one member is required")
	}

	// 2. สร้างห้อง (RoomChat)
	newRoom := entity.RoomChat{
		Type:      "group",
		Name:      req.GroupName,
		AvatarURL: "", // อาจจะรับจาก req หรือใส่ default
		CreatedBy: int(createdBy),
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := s.repo.CreateRoom(&newRoom); err != nil {
		return nil, err
	}

	// 3. เพิ่มคนสร้างเป็น Admin
	adminMember := entity.RoomMember{
		RoomID:   newRoom.ID,
		MemberID: createdBy,
		Role:     "admin",
		JoinedAt: time.Now(),
	}
	s.repo.AddRoomMember(&adminMember)

	// 4. เพิ่มสมาชิกอื่นๆ (Members)
	for _, memberID := range req.MemberIDs {
		// (Optional) เช็คว่า memberID มีตัวตนจริงไหม หรือถูกบล็อกไหม ก่อนเพิ่ม
		if memberID == createdBy {
			continue
		} // กันเหนียว

		member := entity.RoomMember{
			RoomID:   newRoom.ID,
			MemberID: memberID,
			Role:     "member",
			JoinedAt: time.Now(),
		}
		s.repo.AddRoomMember(&member)
	}

	// 5. Return ข้อมูลห้องพร้อมสมาชิก (Preload)
	return s.repo.GetRoomByID(newRoom.ID)
}

func (s *ChatService) UpdateGroupInfo(userID, roomID uint, name, avatarURL string) (*entity.RoomChat, error) {
	// 1. เช็คว่าเป็น Admin หรือไม่
	isAdmin, err := s.repo.IsRoomAdmin(roomID, userID)
	if err != nil || !isAdmin {
		return nil, errors.New("only admin can update group info")
	}

	// 2. ดึงห้องมาแก้ไข
	room, err := s.repo.GetRoomByID(roomID)
	if err != nil {
		return nil, err
	}

	if name != "" {
		room.Name = name
	}
	if avatarURL != "" {
		room.AvatarURL = avatarURL
	}

	// 3. บันทึก (สมมติว่ามี repo.UpdateRoom)
	if err := s.repo.UpdateRoom(room); err != nil {
		return nil, err
	}

	// 4. Broadcast Room Update
	members, _ := s.repo.GetRoomMembers(roomID)
	var targetIDs []uint
	for _, m := range members {
		targetIDs = append(targetIDs, uint(m.MemberID))
	}

	s.hub.TargetedBroadcast <- websocket.WSMessageWithTargets{
		TargetIDs: targetIDs,
		Msg: websocket.WSMessage{
			Type:    "room_update", // ✅ New Event Type
			Payload: room,          // ✅ Send updated room info
			RoomID:  roomID,
		},
	}

	return room, nil
}

// เชิญคนเข้ากลุ่มเพิ่ม
func (s *ChatService) AddMembersToGroup(userID, roomID uint, newMemberIDs []uint) error {
	// 1. เช็คว่าเป็นสมาชิกในห้องไหม (Member เชิญได้)
	isMember, _ := s.repo.IsRoomMember(roomID, userID)
	if !isMember {
		return errors.New("you are not a member of this group")
	}

	// 2. Loop เพิ่มสมาชิก
	for _, memberID := range newMemberIDs {
		// เช็คก่อนว่ามีอยู่แล้วไหม (กัน Error Duplicate Key)
		exists, _ := s.repo.IsRoomMember(roomID, memberID)
		if !exists {
			s.repo.AddRoomMember(&entity.RoomMember{
				RoomID: roomID, MemberID: memberID, Role: "member", JoinedAt: time.Now(),
			})
		}
	}
	// 3. Create System Message: "User invited A, B to the group"
	inviterName := "Someone"
	if inviter, err := s.friendRepo.GetMemberProfile(int(userID)); err == nil {
		inviterName = inviter.FirstName
	}

	// Get names of invited members
	var invitedNames string
	for i, id := range newMemberIDs {
		if member, err := s.friendRepo.GetMemberProfile(int(id)); err == nil {
			if i > 0 {
				invitedNames += ", "
			}
			invitedNames += member.FirstName
		}
	}

	sysMsg := entity.Message{
		RoomID:    roomID,
		SenderID:  userID,
		Content:   inviterName + " เชิญ " + invitedNames + " เข้ากลุ่ม",
		Type:      "system",
		SentAt:    time.Now(),
		IsDeleted: false,
	}
	s.repo.CreateMessage(&sysMsg)

	// Broadcast
	s.broadcastSystemMessage(roomID, &sysMsg)

	return nil
}

// จัดการ Admin (แต่งตั้ง/ปลด)
func (s *ChatService) UpdateMemberRole(adminID, roomID, targetMemberID uint, newRole string) error {
	// 1. เช็คคนสั่งการ ต้องเป็น Admin
	isAdmin, _ := s.repo.IsRoomAdmin(roomID, adminID)
	if !isAdmin {
		return errors.New("permission denied: you are not an admin")
	}

	// 2. ห้ามเปลี่ยน Role ตัวเองผ่าน API นี้ (กันพลาดปลดตัวเอง)
	if adminID == targetMemberID {
		return errors.New("cannot change your own role via this endpoint")
	}

	// 3. อัปเดต
	return s.repo.UpdateMemberRole(roomID, targetMemberID, newRole)
}

// Kick Member (Admin Only)
func (s *ChatService) KickMember(adminID, roomID, targetMemberID uint) error {
	// 1. Check Admin Permission
	isAdmin, _ := s.repo.IsRoomAdmin(roomID, adminID)
	if !isAdmin {
		return errors.New("permission denied: you are not an admin")
	}

	// 2. ดึงข้อมูลกลุ่มเพื่อส่งไปในแจ้งเตือน
	room, err := s.repo.GetRoomByID(roomID)
	if err != nil {
		return err
	}

	// 3. Broadcast "kicked_from_room" event ให้คนที่โดนเตะเท่านั้น
	s.hub.TargetedBroadcast <- websocket.WSMessageWithTargets{
		TargetIDs: []uint{targetMemberID},
		Msg: websocket.WSMessage{
			Type: "kicked_from_room",
			Payload: map[string]interface{}{
				"room_id":   roomID,
				"room_name": room.Name,
				"kicked_by": adminID,
			},
			RoomID: roomID,
		},
	}

	// 4. Remove Member
	if err := s.repo.RemoveRoomMember(roomID, targetMemberID); err != nil {
		return err
	}

	// 5. Create System Message
	adminName := "Admin"
	if admin, err := s.friendRepo.GetMemberProfile(int(adminID)); err == nil {
		adminName = admin.FirstName
	}
	targetName := "Member"
	if target, err := s.friendRepo.GetMemberProfile(int(targetMemberID)); err == nil {
		targetName = target.FirstName
	}

	sysMsg := entity.Message{
		RoomID:    roomID,
		SenderID:  adminID,
		Content:   adminName + " เตะ " + targetName + " ออกจากกลุ่ม",
		Type:      "system",
		SentAt:    time.Now(),
		IsDeleted: false,
	}
	s.repo.CreateMessage(&sysMsg)

	// 6. Broadcast ให้สมาชิกที่เหลือในกลุ่ม (ไม่รวมคนที่โดนเตะ)
	s.broadcastSystemMessage(roomID, &sysMsg)

	return nil
}

func (s *ChatService) LeaveRoom(userID, roomID uint) error {
	// 1. ดึงข้อมูลสมาชิกเพื่อดู Role
	members, err := s.repo.GetRoomMembers(roomID)
	if err != nil {
		return err
	}

	var currentUserRole string
	adminCount := 0

	for _, m := range members {
		if m.Role == "admin" {
			adminCount++
		}
		if m.MemberID == userID {
			currentUserRole = m.Role
		}
	}

	// 2. ⚠️ กฏเหล็ก: ถ้าเราเป็น Admin และเหลือ Admin แค่ 1 คน (คือเรา) ห้ามออก
	if currentUserRole == "admin" && adminCount == 1 {
		// ต้องเช็คด้วยว่าในห้องเหลือคนอื่นไหม ถ้าเหลือแค่เราคนเดียวในห้อง ออกได้เลย (ห้องร้าง)
		if len(members) > 1 {
			return errors.New("you are the only admin. please promote another member to admin before leaving")
		}
	}

	// 3. Create System Message: "User left the group" (Before removing, so they might see it? No, after is better for others)
	userName := "Someone"
	if user, err := s.friendRepo.GetMemberProfile(int(userID)); err == nil {
		userName = user.FirstName
	}

	// 4. ลบตัวเองออกจากห้อง
	if err := s.repo.RemoveRoomMember(roomID, userID); err != nil {
		return err
	}

	// 5. Broadcast System Message
	sysMsg := entity.Message{
		RoomID:    roomID,
		SenderID:  userID,
		Content:   userName + " ออกจากกลุ่ม",
		Type:      "system",
		SentAt:    time.Now(),
		IsDeleted: false,
	}
	s.repo.CreateMessage(&sysMsg)
	s.broadcastSystemMessage(roomID, &sysMsg)

	return nil
}

// Helper for broadcasting system messages
func (s *ChatService) broadcastSystemMessage(roomID uint, msg *entity.Message) {
	members, _ := s.repo.GetRoomMembers(roomID)
	var targetIDs []uint
	for _, m := range members {
		targetIDs = append(targetIDs, uint(m.MemberID))
	}

	s.hub.TargetedBroadcast <- websocket.WSMessageWithTargets{
		TargetIDs: targetIDs,
		Msg: websocket.WSMessage{
			Type:    "new_message",
			Payload: msg,
			RoomID:  roomID,
		},
	}
}

// ----------------------------------------------------------------
// DeleteGroup: ลบกลุ่มแชท (Admin Only)
// ----------------------------------------------------------------
func (s *ChatService) DeleteGroup(adminID, roomID uint) error {
	// 1. ตรวจสอบว่าเป็น Group Chat
	room, err := s.repo.GetRoomByID(roomID)
	if err != nil {
		return errors.New("room not found")
	}

	if room.Type != "group" {
		return errors.New("cannot delete private chat")
	}

	// 2. ตรวจสอบว่า user เป็น admin
	isAdmin, err := s.repo.IsRoomAdmin(roomID, adminID)
	if err != nil {
		return err
	}
	if !isAdmin {
		return errors.New("only admins can delete group")
	}

	// 3. ลบข้อความทั้งหมดในห้อง (Cascade Delete Messages)
	if err := s.repo.DeleteRoomMessages(roomID); err != nil {
		return errors.New("failed to delete messages: " + err.Error())
	}

	// 4. Broadcast WebSocket ให้สมาชิกทุกคนรู้ว่ากลุ่มถูกลบ (ก่อนลบ members)
	members, err := s.repo.GetRoomMembers(roomID)
	if err != nil {
		return err
	}

	var targetIDs []uint
	for _, m := range members {
		targetIDs = append(targetIDs, uint(m.MemberID))
	}

	// Broadcast room deletion event
	s.hub.TargetedBroadcast <- websocket.WSMessageWithTargets{
		TargetIDs: targetIDs,
		Msg: websocket.WSMessage{
			Type:    "room_deleted",
			Payload: map[string]interface{}{"room_id": roomID},
			RoomID:  roomID,
		},
	}

	// 5. ลบสมาชิกทั้งหมดในกลุ่ม (Cascade Delete Members)
	for _, member := range members {
		if err := s.repo.RemoveRoomMember(roomID, member.MemberID); err != nil {
			return err
		}
	}

	// 6. ลบกลุ่ม
	if err := s.repo.DeleteRoom(roomID); err != nil {
		return err
	}

	return nil
}
