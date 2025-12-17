package repository

import (

	"github.com/sut68/team12/backend/internal/entity" // <-- แก้เป็น module ของคุณ
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

//  Block (Unblock) **
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
