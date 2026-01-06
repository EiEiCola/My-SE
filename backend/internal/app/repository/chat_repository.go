package repository

import (
	"errors"
	"time"

	"github.com/sut68/team12/backend/internal/entity"
	"gorm.io/gorm"
)

type ChatRepository interface {
	CreateRoom(room *entity.RoomChat) error

	// ✅ เพิ่ม 3 ฟังก์ชันนี้ใน Interface เพื่อให้ Service เรียกใช้ได้
	AddRoomMember(roomMember *entity.RoomMember) error
	GetRoomMembers(roomID uint) ([]entity.RoomMember, error)
	RemoveRoomMember(roomID, memberID uint) error

	FindPrivateRoom(user1, user2 uint) (*entity.RoomChat, error)
	GetRoomByID(roomID uint) (*entity.RoomChat, error)
	GetMyRooms(userID uint) ([]entity.RoomChat, error)
	CreateMessage(msg *entity.Message) error
	GetRoomMessages(userID, roomID uint) ([]entity.Message, error)

	// Sticker / Unsend
	CountMemberReward(memberID, rewardID uint) (int64, error)
	GetMessageByID(msgID uint) (*entity.Message, error)
	UnsendMessage(msg *entity.Message) error
	ClearChatHistory(memberID, roomID uint) error
}

type chatRepository struct {
	db *gorm.DB
}

func NewChatRepository(db *gorm.DB) ChatRepository {
	return &chatRepository{db: db}
}

func (r *chatRepository) CreateRoom(room *entity.RoomChat) error {
	return r.db.Create(room).Error
}

// 2. เพิ่มสมาชิกเข้าห้อง
func (r *chatRepository) AddRoomMember(roomMember *entity.RoomMember) error {
	return r.db.Create(roomMember).Error
}

// ✅ 3. ดึงสมาชิกในห้อง (สำหรับดูว่าใครอยู่ในกลุ่มบ้าง)
func (r *chatRepository) GetRoomMembers(roomID uint) ([]entity.RoomMember, error) {
	var members []entity.RoomMember
	// Preload Member เพื่อเอารูป/ชื่อ
	err := r.db.Preload("Member").Where("room_id = ?", roomID).Find(&members).Error
	return members, err
}

// ✅ 4. ลบสมาชิกออกจากห้อง (Leave Group)
func (r *chatRepository) RemoveRoomMember(roomID, memberID uint) error {
	return r.db.Where("room_id = ? AND member_id = ?", roomID, memberID).
		Delete(&entity.RoomMember{}).Error
}

func (r *chatRepository) FindPrivateRoom(user1, user2 uint) (*entity.RoomChat, error) {
	var room entity.RoomChat
	err := r.db.Raw(`
        SELECT rc.* FROM room_chats rc
        JOIN room_members rm1 ON rc.room_id = rm1.room_id
        JOIN room_members rm2 ON rc.room_id = rm2.room_id
        WHERE rc.rc_type = 'private' 
        AND rm1.member_id = ? AND rm2.member_id = ?
        LIMIT 1
    `, user1, user2).Scan(&room).Error

	if room.ID == 0 {
		return nil, gorm.ErrRecordNotFound
	}
	return &room, err
}

func (r *chatRepository) GetRoomByID(roomID uint) (*entity.RoomChat, error) {
	var room entity.RoomChat
	err := r.db.First(&room, roomID).Error
	return &room, err
}

func (r *chatRepository) GetMyRooms(userID uint) ([]entity.RoomChat, error) {
	var rooms []entity.RoomChat
	err := r.db.Joins("JOIN room_members ON room_members.room_id = room_chats.room_id").
		Where("room_members.member_id = ?", userID).
		Order("room_chats.updated_at DESC").
		Preload("Member").
		Preload("Member.Member").
		Find(&rooms).Error
	return rooms, err
}

func (r *chatRepository) CreateMessage(msg *entity.Message) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(msg).Error; err != nil {
			return err
		}
		// Update room timestamp
		return tx.Model(&entity.RoomChat{}).Where("room_id = ?", msg.RoomID).
			Update("updated_at", time.Now()).Error
	})
}

func (r *chatRepository) GetRoomMessages(userID, roomID uint) ([]entity.Message, error) {
	var messages []entity.Message
	var member entity.RoomMember

	// 1. หาข้อมูลสมาชิกเพื่อดู ClearedAt
	if err := r.db.Where("room_id = ? AND member_id = ?", roomID, userID).First(&member).Error; err != nil {
		return nil, errors.New("member not found in room")
	}

	// 2. ใช้ ClearedAt เป็นตัวกรอง (ถ้าไม่เคยลบ จะเป็น zero time ก็จะดึงทั้งหมด)
	cutoffTime := member.JoinedAt
	if !member.ClearedAt.IsZero() {
		cutoffTime = member.ClearedAt
	}

	err := r.db.Where("room_id = ? AND sent_at > ?", roomID, cutoffTime).
		Order("sent_at ASC").
		Preload("Sender"). // โหลดโปรไฟล์คนส่ง
		Find(&messages).Error
	return messages, err
}

// Helpers
func (r *chatRepository) CountMemberReward(memberID, rewardID uint) (int64, error) {
	var count int64
	err := r.db.Table("member_rewards").Where("member_id = ? AND reward_id = ?", memberID, rewardID).Count(&count).Error
	return count, err
}

func (r *chatRepository) GetMessageByID(msgID uint) (*entity.Message, error) {
	var msg entity.Message
	err := r.db.First(&msg, msgID).Error
	return &msg, err
}

func (r *chatRepository) UnsendMessage(msg *entity.Message) error {
	return r.db.Save(msg).Error
}

// ✅ แก้ไข: ใช้ cleared_at แทน joined_at
func (r *chatRepository) ClearChatHistory(memberID, roomID uint) error {
	return r.db.Model(&entity.RoomMember{}).
		Where("room_id = ? AND member_id = ?", roomID, memberID).
		Update("cleared_at", time.Now()).Error
}
