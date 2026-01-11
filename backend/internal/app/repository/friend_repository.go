package repository

import (
	"time"

	"github.com/sut68/team12/backend/internal/entity"
	"gorm.io/gorm"
)

type FriendRepository struct {
	DB *gorm.DB
}

func NewFriendRepository(db *gorm.DB) *FriendRepository {
	return &FriendRepository{DB: db}
}

// ----------------- Friend Requests -----------------

func (r *FriendRepository) CreateRequest(req *entity.RequesFriend) error {
	return r.DB.Create(req).Error
}

func (r *FriendRepository) GetRequestByID(id uint) (*entity.RequesFriend, error) {
	var req entity.RequesFriend
	// Preload ข้อมูลผู้ส่งและผู้รับ เพื่อให้หน้าบ้านแสดงชื่อได้
	err := r.DB.Preload("SentMember").Preload("ReceiveMember").First(&req, id).Error
	return &req, err
}

// ตรวจสอบว่ามีความสัมพันธ์ที่เป็นเพื่อนกันอยู่ (Active: true) หรือไม่
func (r *FriendRepository) CheckActiveFriend(m1, m2 int) (bool, error) {
	var count int64
	err := r.DB.Model(&entity.Relations{}).
		Where("((\"member1_ID\" = ? AND \"member2_ID\" = ?) OR (\"member1_ID\" = ? AND \"member2_ID\" = ?)) AND active = ?", m1, m2, m2, m1, true).
		Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *FriendRepository) GetFriendRequests(memberID int, direction string) ([]entity.RequesFriend, error) {
	var reqs []entity.RequesFriend
	var err error

	// 1. ดึงข้อมูลคำขอ + Preload ข้อมูลพื้นฐาน
	if direction == "sent" {
		err = r.DB.
			Preload("ReceiveMember").
			Preload("ReceiveMember.Gender").
			Where("\"sent_mem_id\" = ?", memberID).
			Where("status = ?", 1).
			Find(&reqs).Error
	} else {
		err = r.DB.
			Preload("SentMember").
			Preload("SentMember.Gender").
			Where("\"receive_mem_id\" = ?", memberID).
			Where("status = ?", 1).
			Find(&reqs).Error
	}

	if err != nil {
		return nil, err
	}

	// 2. วนลูปเพื่อ "คำนวณตัวเลข" แล้วยัดใส่ Struct (ไม่ได้ยุ่งกับ DB Table Members)
	for i := range reqs {
		var targetMember *entity.Member

		// เลือกเป้าหมายที่จะนับยอด
		if direction == "sent" {
			targetMember = reqs[i].ReceiveMember
		} else {
			targetMember = reqs[i].SentMember
		}

		// ถ้ามีข้อมูลสมาชิก -> ให้นับเลขแล้วใส่เข้าไปใน Virtual Fields
		if targetMember != nil {
			f, fer, fing := r.CountMemberStats(targetMember.ID)

			// ตรงนี้แหละครับ คือการยัดค่าใส่ Memory ก่อนส่งไป Frontend
			targetMember.FriendCount = f
			targetMember.FollowerCount = fer
			targetMember.FollowingCount = fing
		}
	}

	return reqs, nil
}

// ดึงข้อมูลคำขอล่าสุดระหว่าง Sender และ Receiver
func (r *FriendRepository) GetLatestRequest(sID, rID int) (*entity.RequesFriend, error) {
	var req entity.RequesFriend
	//ใช้ r.DB (เพราะอยู่ใน Repository)
	err := r.DB.Where("sent_mem_id = ? AND receive_mem_id = ?", sID, rID).
		Order("rf_id DESC").
		First(&req).Error
	if err != nil {
		return nil, err
	}
	return &req, nil
}

// อัปเดตข้อมูลทั้งแถว (ใช้ตอนวนรอบ 4 -> 1)
func (r *FriendRepository) UpdateFullRequest(req *entity.RequesFriend) error {
	return r.DB.Save(req).Error
}

// อัปเดตเฉพาะสถานะและเวลา
func (r *FriendRepository) UpdateRequestStatus(id uint, statusID int) error {
	return r.DB.Model(&entity.RequesFriend{}).
		Where("rf_id = ?", id).
		Updates(map[string]interface{}{
			"status":      statusID,
			"finished_at": time.Now(), // เช็คชื่อคอลัมน์ใน DB ให้ตรงกัน
		}).Error
}

// ----------------- Relations (เพื่อน) -----------------

func (r *FriendRepository) CreateRelation(rel *entity.Relations) error {
	return r.DB.Create(rel).Error
}

// สมาชิกเรียกใช้ (Soft Update: เลิกเป็นเพื่อน)
func (r *FriendRepository) UpdateRelationActive(m1, m2 int, active bool) error {
	return r.DB.Model(&entity.Relations{}).
		Where("(\"member1_ID\" = ? AND \"member2_ID\" = ?) OR (\"member1_ID\" = ? AND \"member2_ID\" = ?)", m1, m2, m2, m1).
		Updates(map[string]interface{}{"active": active}).Error
}

func (r *FriendRepository) GetFriendsForUser(memberID int) ([]entity.Member, error) {
	var friends []entity.Member
	// 1. Query รายชื่อเพื่อน
	err := r.DB.Table("members").
		Preload("Gender").
		Joins("JOIN relations ON (relations.\"member1_ID\" = members.id OR relations.\"member2_ID\" = members.id)").
		Where("((relations.\"member1_ID\" = ?) OR (relations.\"member2_ID\" = ?)) AND relations.active = ?", memberID, memberID, true).
		Where("members.id != ?", memberID).
		Find(&friends).Error

	if err != nil {
		return nil, err
	}

	// 2. เพิ่ม Loop นับ Friend/Follower/Following (เพื่อให้ Frontend มีตัวเลขโชว์)
	for i := range friends {
		f, fer, fing := r.CountMemberStats(friends[i].ID)
		friends[i].FriendCount = f
		friends[i].FollowerCount = fer
		friends[i].FollowingCount = fing
	}

	return friends, err
}

// ----------------- Block (บล็อก) -----------------

func (r *FriendRepository) CreateBlock(block *entity.Block) error {
	return r.DB.Create(block).Error
}

func (r *FriendRepository) UpdateBlockStatus(blockerID, blockedID int, active bool) error {
	result := r.DB.Model(&entity.Block{}).
		Where("\"blocker_ID\" = ? AND \"blocked_ID\" = ?", blockerID, blockedID).
		Updates(map[string]interface{}{
			"active":    active,
			"update_at": time.Now(), // บันทึกเวลาทุกครั้งที่เปลี่ยนสถานะ
		})

	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *FriendRepository) GetBlockedUsers(blockerID int) ([]entity.Member, error) {
	var blockedUsers []entity.Member

	// ดึงรายชื่อสมาชิกที่เราเป็นคนไปกดบล็อกเขา และสถานะยังเป็น active = true
	err := r.DB.Table("members").
		Joins("JOIN blocks ON blocks.\"blocked_ID\" = members.id").
		Where("blocks.\"blocker_ID\" = ? AND blocks.active = ?", blockerID, true).
		Select("members.*"). // ดึงเฉพาะข้อมูล Member มาใส่ใน Slice
		Find(&blockedUsers).Error

	return blockedUsers, err
}

func (r *FriendRepository) GetAvailableMembers(currentUserID int) ([]entity.Member, error) {
	var members []entity.Member

	// Query นี้จะเลือกสมาชิกที่:
	// 1. ไม่ใช่ตัวเราเอง
	// 2. เราไม่ได้บล็อกเขา (Active Block = 1)
	// 3. เขาไม่ได้บล็อกเรา (Active Block = 1)
	err := r.DB.Raw(`
		SELECT * FROM members 
		WHERE id != ? 
		AND id NOT IN (SELECT \"blocked_ID\" FROM blocks WHERE \"blocker_ID\" = ? AND active = true)
		AND id NOT IN (SELECT \"blocker_ID\" FROM blocks WHERE \"blocked_ID\" = ? AND active = true)
	`, currentUserID, currentUserID, currentUserID).Find(&members).Error

	return members, err
}

// ----------------- Follow (ติดตาม) -----------------

func (r *FriendRepository) CreateFollow(follow *entity.Follow) error {
	return r.DB.Create(follow).Error
}

func (r *FriendRepository) UpdateFollowStatus(followerID, followedID int, statusID uint) error {
	// ใช้ Updates(map) เพื่อให้ GORM อัปเดตเวลา UpdatedAt ให้เราด้วย
	result := r.DB.Model(&entity.Follow{}).
		Where("\"follower_ID\" = ? AND \"followed_ID\" = ?", followerID, followedID).
		Updates(map[string]interface{}{
			"follow_status_id": statusID,
			"update_at":        time.Now(), // บันทึกเวลาเปลี่ยนสถานะเรียลไทม์
		})

	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

// ดูคนที่มาติดตามเรา - 🛑 ส่วนที่ Error ฟ้องว่าหายไป
func (r *FriendRepository) GetFollowers(memberID int) ([]entity.Member, error) {
	var followers []entity.Member
	err := r.DB.Table("members").
		Joins("JOIN follows ON follows.\"follower_ID\" = members.id").
		Where("follows.\"followed_ID\" = ? AND follows.follow_status_id = ?", memberID, 1). // 1: Following
		Find(&followers).Error
	return followers, err
}

// ดูคนที่เราไปติดตาม - 🛑 ส่วนที่ Error ฟ้องว่าหายไป
func (r *FriendRepository) GetFollowing(memberID int) ([]entity.Member, error) {
	var following []entity.Member
	err := r.DB.Table("members").
		Joins("JOIN follows ON follows.\"followed_ID\" = members.id").
		Where("follows.\"follower_ID\" = ? AND follows.follow_status_id = ?", memberID, 1). // 1: Following
		Find(&following).Error
	return following, err
}

func (r *FriendRepository) GetPopularMembers(myID int) ([]entity.Member, error) {
	var members []entity.Member

	err := r.DB.Table("members").
		Preload("Gender").
		Select("members.*, count(follows.\"followed_ID\") as temp_count").
		Joins("LEFT JOIN follows ON follows.\"followed_ID\" = members.id AND follows.follow_status_id = 1").
		Where("members.deleted_at IS NULL").
		Where("members.id != ?", myID).                                                                                  // ไม่เอาตัวเอง
		Where("members.id NOT IN (SELECT \"blocked_ID\" FROM blocks WHERE \"blocker_ID\" = ? AND active = true)", myID). // กรองคนที่เราบล็อก
		Where("members.id NOT IN (SELECT \"blocker_ID\" FROM blocks WHERE \"blocked_ID\" = ? AND active = true)", myID). // กรองคนที่บล็อกเรา
		Group("members.id").
		Order("count(follows.\"followed_ID\") DESC").
		Limit(10).
		Find(&members).Error

	if err != nil {
		return nil, err
	}

	// Loop นับ Stats
	for i := range members {
		f, fer, fing := r.CountMemberStats(members[i].ID)
		members[i].FriendCount = f
		members[i].FollowerCount = fer
		members[i].FollowingCount = fing
	}

	return members, nil
}

// แก้ไข: รับ myID เพิ่มเข้ามาเพื่อใช้กรอง Block ตอน Search
func (r *FriendRepository) GetAllMembers(myID int) ([]entity.Member, error) {
	var members []entity.Member

	err := r.DB.Model(&entity.Member{}).
		Preload("Gender").
		Where("id != ?", myID). // ไม่เอาตัวเอง (Frontend กรองเองได้ แต่ Filter DB ชัวร์กว่า)
		Where("id NOT IN (SELECT \"blocked_ID\" FROM blocks WHERE \"blocker_ID\" = ? AND active = true)", myID).
		Where("id NOT IN (SELECT \"blocker_ID\" FROM blocks WHERE \"blocked_ID\" = ? AND active = true)", myID).
		Find(&members).Error

	if err != nil {
		return nil, err
	}

	for i := range members {
		f, fer, fing := r.CountMemberStats(members[i].ID)
		members[i].FriendCount = f
		members[i].FollowerCount = fer
		members[i].FollowingCount = fing
	}

	return members, nil
}

// ----------------- Block Logic Enhancements -----------------

// 1. ตรวจสอบว่ามีการบล็อกเกิดขึ้นระหว่าง 2 คนนี้หรือไม่ (ไม่ว่าใครบล็อกใคร)
func (r *FriendRepository) IsBlocked(m1, m2 int) (bool, error) {
	var count int64
	// เช็คว่า m1 บล็อก m2 หรือ m2 บล็อก m1 ที่ Active = true
	err := r.DB.Model(&entity.Block{}).
		Where("((\"blocker_ID\" = ? AND \"blocked_ID\" = ?) OR (\"blocker_ID\" = ? AND \"blocked_ID\" = ?)) AND active = ?", m1, m2, m2, m1, true).
		Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// 2. ปฏิเสธ/ยกเลิกคำขอที่ค้างอยู่ทั้งหมดระหว่าง 2 คนนี้ (ใช้ตอนกด Block)
func (r *FriendRepository) RejectPendingRequestsBetween(m1, m2 int) error {
	// อัปเดตคำขอที่มี status = 1 (Pending) ให้กลายเป็น 3 (Rejected/Cancelled)
	// ทั้งขาไป (m1 -> m2) และขากลับ (m2 -> m1)
	return r.DB.Model(&entity.RequesFriend{}).
		Where("((sent_mem_id = ? AND receive_mem_id = ?) OR (sent_mem_id = ? AND receive_mem_id = ?)) AND status = ?", m1, m2, m2, m1, 1).
		Updates(map[string]interface{}{
			"status":      3, // หรือ 4 (Cancelled) แล้วแต่ design ของคุณ
			"finished_at": time.Now(),
		}).Error
}

// ฟังก์ชันนี้จะวิ่งไปนับจำนวนจากตาราง Relation และ Follow ให้
// Helper: ฟังก์ชันนับ Stats ของสมาชิกคนหนึ่ง
func (r *FriendRepository) CountMemberStats(memberID uint) (int64, int64, int64) {
	var friendCount, followerCount, followingCount int64

	// 1. นับเพื่อน (Relation Active = true)
	// H แก้ไข: ใส่ \"...\" ครอบชื่อคอลัมน์ให้ตรงกับ DB
	r.DB.Model(&entity.Relations{}).
		Where("((\"member1_ID\" = ?) OR (\"member2_ID\" = ?)) AND active = ?", memberID, memberID, true).
		Count(&friendCount)

	// 2. นับผู้ติดตาม (Followers) -> คนที่มาติดตามเรา (followed_ID คือเรา)
	r.DB.Model(&entity.Follow{}).
		Where("\"followed_ID\" = ? AND follow_status_id = 1", memberID).
		Count(&followerCount)

	// 3. นับคนที่เราไปติดตาม (Following) -> คนที่เราไปติดตาม (follower_ID คือเรา)
	r.DB.Model(&entity.Follow{}).
		Where("\"follower_ID\" = ? AND follow_status_id = 1", memberID).
		Count(&followingCount)

	return friendCount, followerCount, followingCount
}

// ดึง Follow ทั้งหมด (สำหรับ Admin)
func (r *FriendRepository) AdminGetAllFollows() ([]entity.Follow, error) {
	var follows []entity.Follow
	err := r.DB.Find(&follows).Error
	return follows, err
}

// ดึงข้อมูล Relations ทั้งหมด (Admin)
func (r *FriendRepository) AdminGetAllRelations() ([]entity.Relations, error) {
	var relations []entity.Relations
	// เพิ่ม Preload Member1 และ Member2
	err := r.DB.Preload("Member1").Preload("Member2").Find(&relations).Error
	return relations, err
}

// ดึงข้อมูล Block ทั้งหมด (Admin)
func (r *FriendRepository) AdminGetAllBlocks() ([]entity.Block, error) {
	var blocks []entity.Block
	// เพิ่ม Preload Blocker และ Blocked
	err := r.DB.Preload("Blocker").Preload("Blocked").Find(&blocks).Error
	return blocks, err
}

// (ส่วน Requests ปกติคุณมี Preload อยู่แล้ว เช็คให้ชัวร์ว่ามีบรรทัดนี้)
func (r *FriendRepository) AdminGetAllRequests() ([]entity.RequesFriend, error) {
	var reqs []entity.RequesFriend
	err := r.DB.Preload("SentMember").Preload("ReceiveMember").Find(&reqs).Error
	return reqs, err
}

// ----------------- DELETE Functions (Hard Delete) -----------------
// 1. ลบ Request (ตารางนี้ปกติใช้ id เล็กอยู่แล้ว หรือถ้าตั้ง rf_id ก็ต้องเช็คดีๆ แต่ปกติ id จะรอด)
func (r *FriendRepository) DeleteRequest(id int) error {
	return r.DB.Unscoped().Delete(&entity.RequesFriend{}, id).Error
}

// 2. ลบ Relation (Friendship)
func (r *FriendRepository) DeleteRelation(m1, m2 int) error {
	return r.DB.Unscoped().
		Where("(\"member1_ID\" = ? AND \"member2_ID\" = ?) OR (\"member1_ID\" = ? AND \"member2_ID\" = ?)", m1, m2, m2, m1).
		Delete(&entity.Relations{}).Error
}

// 3. ลบ Block
func (r *FriendRepository) DeleteBlock(blockerID, blockedID int) error {
	return r.DB.Unscoped().
		Where("\"blocker_ID\" = ? AND \"blocked_ID\" = ?", blockerID, blockedID).
		Delete(&entity.Block{}).Error
}
