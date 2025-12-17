package services

import (
	"errors"
	"time"
    "github.com/sut68/team12/backend/internal/dto"
	"github.com/sut68/team12/backend/internal/entity" // <-- แก้เป็น module ของคุณ
	"github.com/sut68/team12/backend/internal/app/repository"

)

type FriendService struct {
	Repo *repository.FriendRepository
}

func NewFriendService(repo *repository.FriendRepository) *FriendService {
	return &FriendService{Repo: repo}
}

// ---------------------- Send Request -----------------------
func (s *FriendService) SendRequest(data dto.SendRequestDTO) error {

	req := entity.RequesFriend{
		SentMemID:     data.SenderID,
		ReciveMemID:   data.ReceiverID,
		RequesStatusID: 1, 
		CreatedAt:      time.Now(),
	}

	return s.Repo.CreateRequest(&req)
}

// ---------------------- Respond Request -------------------
func (s *FriendService) RespondRequest(data dto.RespondRequestDTO) error {

	req, err := s.Repo.GetRequestByID(data.RequestID)
	if err != nil {
		return errors.New("request not found")
	}

	if data.Accept {
		rel := entity.Relations{
			Member1_ID: req.SentMemID,
			Member2_ID: req.ReciveMemID,
			Active:     true,
			CreatedAt:  time.Now(),
		}
		s.Repo.CreateRelation(&rel)
	}

	return s.Repo.DeleteRequest(req.ID)
}

// ---------------------- Cancel Request -------------------
func (s *FriendService) CancelRequest(data dto.CancelRequestDTO) error {

	req, err := s.Repo.GetRequestByID(data.RequestID)
	if err != nil {
		return err
	}

	if req.SentMemID != data.MemberID {
		return errors.New("not allowed")
	}

	return s.Repo.DeleteRequest(req.ID)
}

// ---------------------- Unfriend -------------------
func (s *FriendService) Unfriend(data dto.UnfriendDTO) error {
	return s.Repo.DeleteRelation(data.MemberID, data.FriendID)
}

// ---------------------- Block -------------------
func (s *FriendService) Block(data dto.BlockDTO) error {
	block := entity.Block{
		BlockerID: data.BlockerID,
		BlockedID: data.BlockedID,
		Active:    true,
		CreatedAt: time.Now(),
	}
	// ควรมีการลบ Relation และ Follows ที่มีอยู่ด้วยเมื่อทำการ Block
	s.Repo.DeleteRelation(data.BlockerID, data.BlockedID) 
	s.Repo.DeleteFollow(data.BlockerID, data.BlockedID) 
	s.Repo.DeleteFollow(data.BlockedID, data.BlockerID)
	
	return s.Repo.CreateBlock(&block)
}

// ** เมธอดใหม่: Unblock **
func (s *FriendService) Unblock(data dto.UnblockDTO) error {
	return s.Repo.DeleteBlock(data.BlockerID, data.BlockedID)
}


// ---------------------- Follow -------------------

// Follow (ติดตาม) **
func (s *FriendService) Follow(data dto.FollowDTO) error {
	// เช็คว่าเคย Follow แล้วหรือยัง? ถ้า Follow แล้วอาจทำการ Unmute
	// ในตัวอย่างนี้จะทำการสร้าง Follow ใหม่ หรืออัปเดตเป็นสถานะ Following (1)
	follow := entity.Follow{
		FollowerID:  data.FollowerID,
		FollowedID:   data.FollowedID,
		FollowStatusID: 1, // 1: Following
		CreatedAt:     time.Now(),
	}
	// ลองอัปเดตก่อน หากไม่มีให้สร้าง
	err := s.Repo.UpdateFollowStatus(data.FollowerID, data.FollowedID, 1)
	if err == nil {
		return nil // อัปเดตสำเร็จ (รวมถึงกรณี Unmute สำเร็จ)
	}
	
	// ถ้า Update ไม่สำเร็จ แสดงว่ายังไม่มี Follow Entity ให้ทำการสร้างใหม่
	return s.Repo.CreateFollow(&follow)
}

// Unfollow (เลิกติดตาม) หรือ Mute **
func (s *FriendService) Unfollow(data dto.UnfollowDTO) error {
	// ในตัวอย่างนี้ ผมจะสมมติว่าถ้าเป็น Unfollow จะเป็นการลบ Entity Follow ทิ้งไปเลย
	// ถ้าต้องการ Mute (ยังติดตามอยู่แต่ไม่เห็นโพสต์) ต้องเปลี่ยนสถานะเป็น Muted (2)
	
	// หากต้องการ Mute แทนการลบ:
	// return s.Repo.UpdateFollowStatus(data.FollowerID, data.FollowedID, 2) // 2: Muted

	// หากต้องการ Unfollow (ลบ Entity):
	return s.Repo.DeleteFollow(data.FollowerID, data.FollowedID)
}

func (s *FriendService) Mute(data dto.MuteDTO) error {
	// 2 คือสถานะ "Muted"
	return s.Repo.UpdateFollowStatus(data.FollowerID, data.FollowedID, 2)
}

// ** เมธอดใหม่: Unmute **
func (s *FriendService) Unmute(data dto.UnmuteDTO) error {
	// 1 คือสถานะ "Following"
	return s.Repo.UpdateFollowStatus(data.FollowerID, data.FollowedID, 1)
}
