package repository

import (
	"github.com/sut68/team12/backend/internal/entity" // <-- แก้เป็น module ของคุณ
	"gorm.io/gorm"
	"time"
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

func (r *FriendRepository) GetRequestByID(id int) (*entity.RequesFriend, error) {
	var req entity.RequesFriend
	err := r.DB.First(&req, id).Error
	return &req, err
}

func (r *FriendRepository) DeleteRequest(id int) error {
	return r.DB.Delete(&entity.RequesFriend{}, id).Error
}

// ----------------- Relations -----------------
func (r *FriendRepository) CreateRelation(rel *entity.Relations) error {
	return r.DB.Create(rel).Error
}

func (r *FriendRepository) DeleteRelation(m1, m2 int) error {
	return r.DB.
		Where("(member1_id=? AND member2_id=?) OR (member1_id=? AND member2_id=?)",
			m1, m2, m2, m1).
		Delete(&entity.Relations{}).Error
}

// ---------------- Block -----------------
func (r *FriendRepository) CreateBlock(block *entity.Block) error {
	return r.DB.Create(block).Error
}

// Block (Unblock) **
func (r *FriendRepository) DeleteBlock(blockerID, blockedID int) error {
	return r.DB.
		Where("blocker_id = ? AND blocked_id = ?", blockerID, blockedID).
		Delete(&entity.Block{}).Error
}

// ---------------- Follow -----------------

// สร้าง Follow (ติดตาม) **
func (r *FriendRepository) CreateFollow(follow *entity.Follow) error {
	return r.DB.Create(follow).Error
}

// ลบ Follow (เลิกติดตาม) **
func (r *FriendRepository) DeleteFollow(followerID, followedID int) error {
	return r.DB.
		Where("follower_id = ? AND followed_id = ?", followerID, followedID).
		Delete(&entity.Follow{}).Error
}

// อัปเดต Follow (เช่น Mute) **
func (r *FriendRepository) UpdateFollowStatus(followerID, followedID int, statusID uint) error {
	return r.DB.Model(&entity.Follow{}).
		Where("follower_id = ? AND followed_id = ?", followerID, followedID).
		Update("follow_status_id", statusID).Error
}

// ดูรายชื่อสมาชิกทั้งหมด
func (r *FriendRepository) GetAllMembers() ([]entity.Member, error) {
	var members []entity.Member
	err := r.DB.Find(&members).Error
	return members, err
}

// ดูรายชื่อเพื่อน (Member1 หรือ Member2 ที่ตรงกับเรา)
func (r *FriendRepository) GetFriends(memberID int) ([]entity.Member, error) {
	var relations []entity.Relations
	err := r.DB.Where("member1_id = ? OR member2_id = ?", memberID, memberID).Find(&relations).Error
	if err != nil {
		return nil, err
	}

	var friendIDs []int
	for _, rel := range relations {
		if rel.Member1_ID == memberID {
			friendIDs = append(friendIDs, rel.Member2_ID)
		} else {
			friendIDs = append(friendIDs, rel.Member1_ID)
		}
	}
	var friends []entity.Member
	err = r.DB.Where("id IN ?", friendIDs).Find(&friends).Error
	return friends, err
}

// ดูผู้ติดตาม (People who follow me)
func (r *FriendRepository) GetFollowers(memberID int) ([]entity.Member, error) {
	var followers []entity.Member
	err := r.DB.Table("members").
		Joins("JOIN follows ON follows.follower_id = members.id").
		Where("follows.followed_id = ?", memberID).Find(&followers).Error
	return followers, err
}

// ดูคนที่เรากำลังติดตาม (People I follow)
func (r *FriendRepository) GetFollowing(memberID int) ([]entity.Member, error) {
	var following []entity.Member
	err := r.DB.Table("members").
		Joins("JOIN follows ON follows.followed_id = members.id").
		Where("follows.follower_id = ?", memberID).Find(&following).Error
	return following, err
}

// ดูคนที่โดนเราบล็อก
func (r *FriendRepository) GetBlockedUsers(memberID int) ([]entity.Member, error) {
	var blocked []entity.Member
	err := r.DB.Table("members").
		Joins("JOIN blocks ON blocks.blocked_id = members.id").
		Where("blocks.blocker_id = ?", memberID).Find(&blocked).Error
	return blocked, err
}

// ดูคำขอ (Sent & Received)
func (r *FriendRepository) GetFriendRequests(memberID int, direction string) ([]entity.RequesFriend, error) {
	var reqs []entity.RequesFriend
	query := r.DB.Preload("Member") // สมมติว่าตั้งชื่อ Relationship ไว้
	if direction == "sent" {
		err := query.Where("sent_mem_id = ?", memberID).Find(&reqs).Error
		return reqs, err
	}
	err := query.Where("receive_mem_id = ?", memberID).Find(&reqs).Error
	return reqs, err
}

// UpdateRequestStatus เปลี่ยนสถานะคำขอ (1:Pending, 2:Accepted, 3:Rejected)
func (r *FriendRepository) UpdateRequestStatus(id int, statusID int) error {
	return r.DB.Model(&entity.RequesFriend{}).
		Where("rf_id = ?", id).
		Updates(map[string]interface{}{
			"status":      statusID,
			"finished_at": time.Now(),
		}).Error
}

func (r *FriendRepository) UpdateRelationActive(m1, m2 int, active bool) error {
	return r.DB.Model(&entity.Relations{}).
		Where("(member1_ID = ? AND member2_ID = ?) OR (member1_ID = ? AND member2_ID = ?)", m1, m2, m2, m1).
		Update("active", active).Error
}

// สมาชิกเห็นเฉพาะเพื่อนที่ Active
func (r *FriendRepository) GetFriendsForUser(memberID int) ([]entity.Member, error) {
	var friends []entity.Member
	err := r.DB.Table("members").
		Joins("JOIN relations ON (relations.member1_id = members.id OR relations.member2_id = members.id)").
		Where("((relations.member1_id = ?) OR (relations.member2_id = ?)) AND relations.active = ?", memberID, memberID, true).
		Where("members.id != ?", memberID).
		Find(&friends).Error
	return friends, err
}

// สมาชิกเห็นเฉพาะคำขอที่ยังค้างอยู่ (Pending)
func (r *FriendRepository) GetPendingRequests(memberID int) ([]entity.RequesFriend, error) {
	var reqs []entity.RequesFriend
	err := r.DB.Where("receive_mem_id = ? AND status = 1", memberID).Find(&reqs).Error
	return reqs, err
}

// แอดมินเห็นประวัติทั้งหมด ไม่ว่าจะ Active หรือไม่
func (r *FriendRepository) AdminGetAllRelations() ([]entity.Relations, error) {
	var relations []entity.Relations
	err := r.DB.Find(&relations).Error
	return relations, err
}
