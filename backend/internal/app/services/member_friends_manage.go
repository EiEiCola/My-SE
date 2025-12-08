package services

import (
	"errors"
	"time"

	"github.com/sut68/team12/backend/internal/entity"
	"gorm.io/gorm"
)

// กำหนดค่าคงที่ให้ตรงกับตาราง RequesStatus
const (
	FriendReqStatusPending  = 1
	FriendReqStatusAccepted = 2
	FriendReqStatusRejected = 3
	FriendReqStatusCanceled = 4
)

type FriendService struct {
	DB *gorm.DB
}

func NewFriendService(db *gorm.DB) *FriendService {
	return &FriendService{DB: db}
}

// ----------------------
// 1) ส่งคำขอเป็นเพื่อน
// ----------------------
func (s *FriendService) SendFriendRequest(senderID, targetID int) (*entity.RequesFriend, error) {
	if senderID == targetID {
		return nil, errors.New("cannot send friend request to yourself")
	}

	// ตรวจว่ามี member ทั้งคู่มั้ย
	var sender, receiver entity.Member
	if err := s.DB.First(&sender, senderID).Error; err != nil {
		return nil, errors.New("sender not found")
	}
	if err := s.DB.First(&receiver, targetID).Error; err != nil {
		return nil, errors.New("receiver not found")
	}

	// เช็คว่ามีคำขอ pending ซ้ำไหม
	var existing entity.RequesFriend
	if err := s.DB.
		Where("sent_mem_id = ? AND receive_mem_id = ? AND status = ?", senderID, targetID, FriendReqStatusPending).
		First(&existing).Error; err == nil {
		return nil, errors.New("friend request already pending")
	}

	rf := entity.RequesFriend{
		SentMemID:      senderID,
		ReciveMemID:    targetID,
		CreatedAt:      time.Now(),
		RequesStatusID: FriendReqStatusPending,
	}

	if err := s.DB.Create(&rf).Error; err != nil {
		return nil, err
	}

	return &rf, nil
}

// ----------------------
// 2) ยืนยันคำขอเป็นเพื่อน
// ----------------------
func (s *FriendService) AcceptFriendRequest(reqID int) (*entity.Relations, error) {
	var rf entity.RequesFriend
	if err := s.DB.First(&rf, reqID).Error; err != nil {
		return nil, errors.New("friend request not found")
	}

	if rf.RequesStatusID != FriendReqStatusPending {
		return nil, errors.New("friend request is not pending")
	}

	tx := s.DB.Begin()

	// update สถานะคำขอ
	now := time.Now()
	rf.RequesStatusID = FriendReqStatusAccepted
	rf.FinishedAt = now
	if err := tx.Save(&rf).Error; err != nil {
		tx.Rollback()
		return nil, err
	}

	// สร้าง relation (เป็นเพื่อนกัน)
	member1 := rf.SentMemID
	member2 := rf.ReciveMemID
	if member1 > member2 {
		member1, member2 = member2, member1 // จัดลำดับให้ member1 < member2 ป้องกันข้อมูลซ้ำ
	}

	rel := entity.Relations{
		Member1_ID: member1,
		Member2_ID: member2,
		CreatedAt:  now,
		UpdatedAt:  now,
		Active:     true,
	}

	if err := tx.Create(&rel).Error; err != nil {
		tx.Rollback()
		return nil, err
	}

	if err := tx.Commit().Error; err != nil {
		return nil, err
	}

	return &rel, nil
}

// ----------------------
// 3) ปฏิเสธคำขอเป็นเพื่อน
// ----------------------
func (s *FriendService) RejectFriendRequest(reqID int) error {
	var rf entity.RequesFriend
	if err := s.DB.First(&rf, reqID).Error; err != nil {
		return errors.New("friend request not found")
	}

	if rf.RequesStatusID != FriendReqStatusPending {
		return errors.New("friend request is not pending")
	}

	rf.RequesStatusID = FriendReqStatusRejected
	rf.FinishedAt = time.Now()

	return s.DB.Save(&rf).Error
}

// ----------------------
// 4) ดึงลิสต์เพื่อนของ member
// ----------------------
func (s *FriendService) GetFriends(memberID int) ([]entity.Member, error) {
	var rels []entity.Relations

	if err := s.DB.
		Where("(member1_ID = ? OR member2_ID = ?) AND active = ?", memberID, memberID, true).
		Find(&rels).Error; err != nil {
		return nil, err
	}

	if len(rels) == 0 {
		return []entity.Member{}, nil
	}

	friendIDs := make([]int, 0, len(rels))
	for _, r := range rels {
		if r.Member1_ID == memberID {
			friendIDs = append(friendIDs, r.Member2_ID)
		} else {
			friendIDs = append(friendIDs, r.Member1_ID)
		}
	}

	var friends []entity.Member
	if err := s.DB.Where("id IN ?", friendIDs).Find(&friends).Error; err != nil {
		return nil, err
	}

	return friends, nil
}

// ----------------------
// 5) บล็อก / ยกเลิกบล็อก
// ----------------------
func (s *FriendService) BlockMember(blockerID, blockedID int) (*entity.Block, error) {
	if blockerID == blockedID {
		return nil, errors.New("cannot block yourself")
	}

	// เช็ค block เดิม
	var existing entity.Block
	if err := s.DB.
		Where("blocker_ID = ? AND blocked_ID = ? AND active = ?", blockerID, blockedID, true).
		First(&existing).Error; err == nil {
		return nil, errors.New("already blocked")
	}

	now := time.Now()
	b := entity.Block{
		BlockerID: blockerID,
		BlockedID: blockedID,
		CreatedAt: now,
		UpdatedAt: now,
		Active:    true,
	}

	if err := s.DB.Create(&b).Error; err != nil {
		return nil, err
	}

	return &b, nil
}

func (s *FriendService) UnblockMember(blockerID, blockedID int) error {
	var b entity.Block
	if err := s.DB.
		Where("blocker_ID = ? AND blocked_ID = ? AND active = ?", blockerID, blockedID, true).
		First(&b).Error; err != nil {
		return errors.New("active block not found")
	}

	b.Active = false
	b.UpdatedAt = time.Now()

	return s.DB.Save(&b).Error
}

// ----------------------
// 6) ยกเลิกคำขอเป็นเพื่อน (Cancel)
// ----------------------
func (s *FriendService) CancelFriendRequest(reqID int) error {
	var rf entity.RequesFriend

	// หา record คำขอจาก id
	if err := s.DB.First(&rf, reqID).Error; err != nil {
		return errors.New("friend request not found")
	}

	// อนุญาตให้ cancel ได้เฉพาะคำขอที่ยัง pending
	if rf.RequesStatusID != FriendReqStatusPending {
		return errors.New("friend request is not pending")
	}

	// เปลี่ยนสถานะเป็น CANCELED
	rf.RequesStatusID = FriendReqStatusCanceled
	rf.FinishedAt = time.Now()

	// บันทึกลง DB
	if err := s.DB.Save(&rf).Error; err != nil {
		return err
	}

	return nil
}

// ----------------------
// 7) ลบเพื่อน (Unfriend)
// ----------------------
func (s *FriendService) Unfriend(memberID, targetID int) error {
	if memberID == targetID {
		return errors.New("cannot unfriend yourself")
	}

	var rel entity.Relations

	// หา relation ที่ยัง active อยู่ ระหว่าง memberID กับ targetID
	if err := s.DB.
		Where(
			"(member1_ID = ? AND member2_ID = ?) OR (member1_ID = ? AND member2_ID = ?)",
			memberID, targetID, targetID, memberID,
		).
		Where("active = ?", true).
		First(&rel).Error; err != nil {
		return errors.New("active friendship not found")
	}

	// เปลี่ยนให้เป็น inactive (soft delete)
	rel.Active = false
	rel.UpdatedAt = time.Now()

	if err := s.DB.Save(&rel).Error; err != nil {
		return err
	}

	return nil
}
