package repository

import (
	"errors"
	"time"

	"github.com/sut68/team12/backend/internal/entity"
	"gorm.io/gorm"
)

type ChatRepository interface {
	// Room Management
	CreateRoom(room *entity.RoomChat) error
	GetRoomByID(roomID uint) (*entity.RoomChat, error)
	GetMyRooms(userID uint) ([]entity.RoomChat, error)
	FindPrivateRoom(user1, user2 uint) (*entity.RoomChat, error)

	UpdateRoom(room *entity.RoomChat) error
    UpdateMemberRole(roomID, memberID uint, role string) error
    IsRoomAdmin(roomID, userID uint) (bool, error)
    IsRoomMember(roomID, userID uint) (bool, error) // เช็คว่าเป็นสมาชิกไหม

	// Member Management
	AddRoomMember(roomMember *entity.RoomMember) error
	GetRoomMembers(roomID uint) ([]entity.RoomMember, error)
	RemoveRoomMember(roomID, memberID uint) error

	// Message Management
	CreateMessage(msg *entity.Message) error
	GetRoomMessages(userID, roomID uint) ([]entity.Message, error)
	GetMessageByID(msgID uint) (*entity.Message, error)
	UnsendMessage(msg *entity.Message) error
	ClearChatHistory(memberID, roomID uint) error

	// Utils (Sticker Ownership)
	CountMemberReward(memberID, rewardID uint) (int64, error)
}

type chatRepository struct {
	db *gorm.DB
}

func NewChatRepository(db *gorm.DB) ChatRepository {
	return &chatRepository{db: db}
}

// ------------------------------------------------------------------
// Room Management
// ------------------------------------------------------------------

func (r *chatRepository) CreateRoom(room *entity.RoomChat) error {
	return r.db.Create(room).Error
}

func (r *chatRepository) GetRoomByID(roomID uint) (*entity.RoomChat, error) {
	var room entity.RoomChat

	// ✅ ใช้ Preload แบบระบุ Select เพื่อดึงเฉพาะฟิลด์ที่ต้องการของ Member (Optimization)
	err := r.db.
		Preload("Member"). // Preload ตารางกลาง (RoomMember) เพื่อเอา Role/JoinedAt
		Preload("Member.Member", func(db *gorm.DB) *gorm.DB {
			// เลือกเฉพาะฟิลด์ที่จำเป็นสำหรับการแสดงผลหน้าแชท
			return db.Select("id, first_name, last_name, username, member_picture, student_id, dob")
		}).
		First(&room, roomID).Error

	return &room, err
}

func (r *chatRepository) GetMyRooms(userID uint) ([]entity.RoomChat, error) {
	var rooms []entity.RoomChat

	// ดึงห้องที่ User นี้เป็นสมาชิกอยู่ โดยเรียงตาม UpdatedAt ล่าสุด
	err := r.db.Joins("JOIN room_members ON room_members.room_id = room_chats.room_id").
		Where("room_members.member_id = ?", userID).
		Order("room_chats.updated_at DESC").
		// ✅ Preload แบบประหยัด (Optimization)
		Preload("Member").
		Preload("Member.Member", func(db *gorm.DB) *gorm.DB {
			return db.Select("id, first_name, last_name, username, member_picture, student_id, dob")
		}).
		Find(&rooms).Error

	return rooms, err
}

func (r *chatRepository) FindPrivateRoom(user1, user2 uint) (*entity.RoomChat, error) {
	var roomID uint

	// ใช้ SQL หาเฉพาะ ID ของห้อง Private ที่มีสมาชิกแค่ 2 คนนี้
	// (ต้องใช้ Raw SQL เพราะ Logic การหาห้องคู่สนทนาซับซ้อนกว่า GORM ปกติ)
	err := r.db.Raw(`
		SELECT rc.room_id FROM room_chats rc
		JOIN room_members rm1 ON rc.room_id = rm1.room_id
		JOIN room_members rm2 ON rc.room_id = rm2.room_id
		WHERE rc.type = 'private' 
		AND rm1.member_id = ? AND rm2.member_id = ?
		LIMIT 1
	`, user1, user2).Scan(&roomID).Error

	if err != nil {
		return nil, err
	}

	if roomID == 0 {
		return nil, gorm.ErrRecordNotFound
	}

	// เรียกฟังก์ชัน GetRoomByID เพื่อดึงข้อมูลห้อง + สมาชิกแบบ Preload ครบถ้วน
	return r.GetRoomByID(roomID)
}

// ------------------------------------------------------------------
// Member Management
// ------------------------------------------------------------------

func (r *chatRepository) AddRoomMember(roomMember *entity.RoomMember) error {
	return r.db.Create(roomMember).Error
}

func (r *chatRepository) GetRoomMembers(roomID uint) ([]entity.RoomMember, error) {
	var members []entity.RoomMember

	// ✅ Preload เฉพาะข้อมูลที่จำเป็น
	err := r.db.
		Preload("Member", func(db *gorm.DB) *gorm.DB {
			return db.Select("id, first_name, last_name, username, member_picture, student_id")
		}).
		Where("room_id = ?", roomID).
		Find(&members).Error

	return members, err
}

func (r *chatRepository) RemoveRoomMember(roomID, memberID uint) error {
	// ลบสมาชิกออกจากห้อง (Hard Delete ในตาราง RoomMember)
	return r.db.Where("room_id = ? AND member_id = ?", roomID, memberID).
		Delete(&entity.RoomMember{}).Error
}

// ------------------------------------------------------------------
// Message Management
// ------------------------------------------------------------------

func (r *chatRepository) CreateMessage(msg *entity.Message) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// 1. บันทึกข้อความ
		if err := tx.Create(msg).Error; err != nil {
			return err
		}
		// 2. อัปเดตเวลาล่าสุดของห้อง (เพื่อให้ห้องเด้งไปบนสุดในรายการแชท)
		return tx.Model(&entity.RoomChat{}).Where("room_id = ?", msg.RoomID).
			Update("updated_at", time.Now()).Error
	})
}

func (r *chatRepository) GetRoomMessages(userID, roomID uint) ([]entity.Message, error) {
	var messages []entity.Message
	var member entity.RoomMember

	// 1. หาข้อมูลสมาชิกในห้องนี้เพื่อดู ClearedAt (เวลาที่เขากดลบแชท)
	if err := r.db.Where("room_id = ? AND member_id = ?", roomID, userID).First(&member).Error; err != nil {
		return nil, errors.New("member not found in room")
	}

	// 2. กำหนดเวลาตัดเกรดข้อความ (เอาเฉพาะข้อความหลังเวลา JoinedAt หรือ ClearedAt)
	cutoffTime := member.JoinedAt
	if !member.ClearedAt.IsZero() {
		cutoffTime = member.ClearedAt
	}

	// 3. ดึงข้อความ
	err := r.db.Where("room_id = ? AND sent_at > ?", roomID, cutoffTime).
        Order("sent_at ASC").
        
        // ✅ Preload คนส่งข้อความ (เอาแค่รูปกับชื่อพอ ไม่เอาวันเกิด/รหัสนศ. ก็ได้ถ้าไม่ใช้)
        Preload("Sender", func(db *gorm.DB) *gorm.DB {
             return db.Select("id, first_name, last_name, username, member_picture") 
        }).
        Preload("Sticker").
        Find(&messages).Error

    return messages, err
}

func (r *chatRepository) GetMessageByID(msgID uint) (*entity.Message, error) {
	var msg entity.Message
	// ดึงข้อความเดี่ยวๆ (ใช้ตอนส่ง WebSocket เพื่อให้ได้ข้อมูลครบถ้วน)
	err := r.db.
		Preload("Sender", func(db *gorm.DB) *gorm.DB {
			return db.Select("id, first_name, last_name, username, member_picture")
		}).
		Preload("Sticker").
		First(&msg, msgID).Error
	return &msg, err
}

func (r *chatRepository) UnsendMessage(msg *entity.Message) error {
	// บันทึกการเปลี่ยนแปลง (เช่น is_deleted = true)
	return r.db.Save(msg).Error
}

func (r *chatRepository) ClearChatHistory(memberID, roomID uint) error {
	// อัปเดตเวลา cleared_at เป็นปัจจุบัน (Soft Clear: ข้อความเก่าไม่หายจาก DB แต่มองไม่เห็น)
	return r.db.Model(&entity.RoomMember{}).
		Where("room_id = ? AND member_id = ?", roomID, memberID).
		Update("cleared_at", time.Now()).Error
}

// ------------------------------------------------------------------
// Utilities
// ------------------------------------------------------------------

// เช็คสิทธิ์การใช้ Sticker (Reward)
func (r *chatRepository) CountMemberReward(memberID, rewardID uint) (int64, error) {
	var count int64
	err := r.db.Model(&entity.MemberReward{}).
		Where("member_id = ? AND reward_id = ?", memberID, rewardID).
		Count(&count).Error
	return count, err
}


// ลบห้อง (Soft Delete หรือ Hard Delete แล้วแต่ Design)
func (r *chatRepository) DeleteRoom(roomID uint) error {
	return r.db.Delete(&entity.RoomChat{}, roomID).Error
}

func (r *chatRepository) UpdateRoom(room *entity.RoomChat) error {
    return r.db.Save(room).Error
}

func (r *chatRepository) UpdateMemberRole(roomID, memberID uint, role string) error {
    return r.db.Model(&entity.RoomMember{}).
        Where("room_id = ? AND member_id = ?", roomID, memberID).
        Update("role", role).Error
}

func (r *chatRepository) IsRoomAdmin(roomID, userID uint) (bool, error) {
    var count int64
    err := r.db.Model(&entity.RoomMember{}).
        Where("room_id = ? AND member_id = ? AND role = 'admin'", roomID, userID).
        Count(&count).Error
    return count > 0, err
}

func (r *chatRepository) IsRoomMember(roomID, userID uint) (bool, error) {
    var count int64
    err := r.db.Model(&entity.RoomMember{}).
        Where("room_id = ? AND member_id = ?", roomID, userID).
        Count(&count).Error
    return count > 0, err
}
