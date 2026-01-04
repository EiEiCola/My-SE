package repository

// import (
//     "errors"
//     "time"

//     "gorm.io/gorm"
//     "github.com/sut68/team12/backend/internal/entity"
// )

// // struct นี้เป็นตัวพิมพ์เล็ก (Private) ถูกแล้ว
// type chatRepository struct {
//     db *gorm.DB
// }

// // ✅ แก้ไขตรงนี้: Return Type ต้องเป็น ChatRepository (Interface)
// func NewChatRepository(db *gorm.DB) ChatRepository {
//     return &chatRepository{db: db}
// }

// // 1. สร้างห้องใหม่
// func (r *chatRepository) CreateRoom(room *entity.RoomChat) error {
//     return r.db.Create(room).Error
// }

// // 2. เพิ่มสมาชิกเข้าห้อง
// func (r *chatRepository) AddRoomMember(roomMember *entity.RoomMember) error {
//     return r.db.Create(roomMember).Error
// }

// // 3. ดึงข้อมูลห้องจาก ID
// func (r *chatRepository) GetRoomByID(roomID uint) (*entity.RoomChat, error) {
//     var room entity.RoomChat
//     err := r.db.First(&room, roomID).Error
//     return &room, err
// }

// // 4. ดึงรายชื่อห้องของฉัน
// func (r *chatRepository) GetMyRooms(memberID uint) ([]entity.RoomChat, error) {
//     var rooms []entity.RoomChat
//     err := r.db.Joins("JOIN room_members ON room_members.room_id = room_chats.id").
//         Where("room_members.member_id = ?", memberID).
//         Order("room_chats.updated_at DESC").
//         Find(&rooms).Error
//     return rooms, err
// }

// // 5. สร้างข้อความ
// func (r *chatRepository) CreateMessage(msg *entity.Message) error {
//     return r.db.Transaction(func(tx *gorm.DB) error {
//         if err := tx.Create(msg).Error; err != nil {
//             return err
//         }
//         // อัปเดตเวลาห้อง
//         if err := tx.Model(&entity.RoomChat{}).Where("id = ?", msg.RoomID).
//             Update("updated_at", time.Now()).Error; err != nil {
//             return err
//         }
//         return nil
//     })
// }

// // 6. ดึงข้อความในห้อง (กรอง ClearedAt)
// func (r *chatRepository) GetRoomMessages(userID, roomID uint) ([]entity.Message, error) {
//     var messages []entity.Message

//     var member entity.RoomMember
//     if err := r.db.Where("room_id = ? AND member_id = ?", roomID, userID).First(&member).Error; err != nil {
//         return nil, errors.New("member not found in room")
//     }

//     // ใช้ JoinedAt เป็นจุดตัดเวลา (ถ้ามี field last_cleared_at ให้เปลี่ยนมาใช้ตรงนี้)
//     cutoffTime := member.JoinedAt 

//     err := r.db.Where("room_id = ? AND sent_at >= ?", roomID, cutoffTime).
//         Order("sent_at ASC").
//         Find(&messages).Error

//     return messages, err
// }

// // 7. ดึงข้อความเดียว
// func (r *chatRepository) GetMessageByID(msgID uint) (*entity.Message, error) {
//     var msg entity.Message
//     err := r.db.First(&msg, msgID).Error
//     return &msg, err
// }

// // 8. หาห้องส่วนตัว (Private 1-1)
// func (r *chatRepository) FindPrivateRoom(member1ID, member2ID uint) (*entity.RoomChat, error) {
//     var room entity.RoomChat
    
//     err := r.db.Table("room_chats").
//         Joins("JOIN room_members m1 ON m1.room_id = room_chats.id").
//         Joins("JOIN room_members m2 ON m2.room_id = room_chats.id").
//         Where("room_chats.type = ?", "private").
//         Where("m1.member_id = ? AND m2.member_id = ?", member1ID, member2ID).
//         First(&room).Error

//     if errors.Is(err, gorm.ErrRecordNotFound) {
//         return nil, nil 
//     }
//     return &room, err
// }

// // 9. เช็คว่ามี Sticker
// func (r *chatRepository) CountMemberReward(memberID, rewardID uint) (int64, error) {
//     var count int64
//     // ⚠️ เช็คชื่อ Table ใน Database จริงๆ อีกทีนะครับ
//     err := r.db.Table("member_rewards").
//         Where("member_id = ? AND reward_id = ?", memberID, rewardID).
//         Count(&count).Error
//     return count, err
// }

// // 10. ยกเลิกข้อความ
// func (r *chatRepository) UnsendMessage(msg *entity.Message) error {
//     return r.db.Save(msg).Error
// }

// // 11. ล้างประวัติแชท
// func (r *chatRepository) ClearChatHistory(memberID, roomID uint) error {
//     return r.db.Model(&entity.RoomMember{}).
//         Where("room_id = ? AND member_id = ?", roomID, memberID).
//         Update("joined_at", time.Now()).Error 
// }