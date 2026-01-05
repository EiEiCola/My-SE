package services

import (
	"errors"
	"time"

	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/dto"
	"github.com/sut68/team12/backend/internal/entity"

	"gorm.io/gorm"
)

type FriendService struct {
	Repo *repository.FriendRepository
}

func NewFriendService(repo *repository.FriendRepository) *FriendService {
	return &FriendService{Repo: repo}
}

// ---------------------- Friend Requests -----------------------

func (s *FriendService) SendRequest(data dto.SendRequestDTO) error {
	if data.SenderID == data.ReceiverID {
		return errors.New("ไม่สามารถส่งคำขอเป็นเพื่อนให้ตนเองได้")
	}

	isBlocked, err := s.Repo.IsBlocked(data.SenderID, data.ReceiverID)
	if err == nil && isBlocked {
		return errors.New("ไม่สามารถส่งคำขอได้ เนื่องจากมีการบล็อกผู้ใช้")
	}

	// ตรวจสอบในตาราง Relation ว่าเป็นเพื่อนกันอยู่หรือไม่ (Active: true)
	isFriend, err := s.Repo.CheckActiveFriend(data.SenderID, data.ReceiverID)
	if err == nil && isFriend {
		return errors.New("คุณเป็นเพื่อนกับสมาชิกท่านนี้อยู่แล้ว")
	}

	// 2. ค้นหาคำขอล่าสุดเพื่อเช็คประวัติ (Logic เดิมที่คุณมี)
	existingReq, err := s.Repo.GetLatestRequest(data.SenderID, data.ReceiverID)

	if err != nil {
		// ถ้า Error ไม่ใช่ "หาไม่เจอ" (แปลว่า DB มีปัญหาจริง) ให้ return error ออกไปเลย
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return err
		}
		// ถ้า Error คือ "หาไม่เจอ" (RecordNotFound) -> ปล่อยผ่านไปทำบรรทัดล่าง (สร้างใหม่)
	}

	// ถ้าเจอข้อมูลเดิม (err == nil)
	if existingReq != nil {
		if existingReq.RequesStatusID == 1 {
			return errors.New("คุณมีคำขอที่รอดำเนินการอยู่แล้ว")
		}

		// กรณีเป็น Accepted (2) ไปแล้วแต่ในตาราง Relation อาจจะถูก Unfriend (Active: false)
		// จะยอมให้ส่งคำขอใหม่ได้ โดยการสร้าง Row ใหม่ (เนื่องจากคุณต้องการให้จบที่สถานะ 2, 3, 4)

		if existingReq.RequesStatusID == 4 {
			existingReq.RequesStatusID = 1
			existingReq.FinishedAt = time.Now()
			return s.Repo.UpdateFullRequest(existingReq)
		}
	}

	// สร้างข้อมูลใหม่ (กรณีไม่เคยมี หรือกรณีของเดิมถูกปฏิเสธ/เลิกเป็นเพื่อนไปแล้ว)
	req := entity.RequesFriend{
		SentMemID:      data.SenderID,
		ReceiveMemID:   data.ReceiverID,
		RequesStatusID: 1,
		CreatedAt:      time.Now(),
		FinishedAt:     time.Now(),
	}
	return s.Repo.CreateRequest(&req)
}

func (s *FriendService) RespondRequest(data dto.RespondRequestDTO) error {
	req, err := s.Repo.GetRequestByID(data.RequestID)
	if err != nil {
		return errors.New("ไม่พบข้อมูลคำขอ")
	}

	if req.RequesStatusID != 1 {
		return errors.New("คำขอนี้ถูกดำเนินการไปแล้ว ไม่สามารถเปลี่ยนสถานะซ้ำได้")
	}

	if int(req.ReceiveMemID) != data.MemberID {
		return errors.New("คุณไม่มีสิทธิ์ตอบรับคำขอนี้")
	}

	if data.Accept {
		// 1. สร้างความสัมพันธ์เพื่อน (Relations)
		rel := entity.Relations{
			Member1_ID: int(req.SentMemID),
			Member2_ID: int(req.ReceiveMemID),
			Active:     true,
			CreatedAt:  time.Now(),
		}
		if err := s.Repo.CreateRelation(&rel); err != nil {
			return err
		}

		// สร้าง Follow อัตโนมัติ 2 ทาง พร้อมบันทึกเวลา
		s.AutoFollow(int(req.SentMemID), int(req.ReceiveMemID))
		s.AutoFollow(int(req.ReceiveMemID), int(req.SentMemID))

		return s.Repo.UpdateRequestStatus(uint(req.ID), 2)
	}

	return s.Repo.UpdateRequestStatus(uint(req.ID), 3)
}

func (s *FriendService) CancelRequest(data dto.CancelRequestDTO) error {
	req, err := s.Repo.GetRequestByID(data.RequestID)
	if err != nil {
		return err
	}

	// ⭐ 3. ใส่ int() เพื่อกัน Type Mismatch (uint vs int)
	if int(req.SentMemID) != data.MemberID {
		return errors.New("you are not authorized to cancel this request")
	}
	if req.RequesStatusID != 1 {
		return errors.New("request cannot be cancelled (already processed)")
	}

	// อัปเดตสถานะเป็น Cancelled (4) แทนการ Delete
	return s.Repo.UpdateRequestStatus(uint(req.ID), 4)
}

// ---------------------- Friendships (Relations) -------------------

func (s *FriendService) Unfriend(data dto.UnfriendDTO) error {
	// อัปเดต Active จาก 1 เป็น 0 เพื่อเก็บประวัติ
	return s.Repo.UpdateRelationActive(data.MemberID, data.FriendID, false)
}

// ---------------------- Block -------------------

func (s *FriendService) Block(data dto.BlockDTO) error {
	// 1. ตรวจสอบว่าเคยมีข้อมูลการบล็อกคู่นี้อยู่ใน DB หรือไม่ (เพื่อประหยัดพื้นที่ตามที่คุณต้องการ)
	err := s.Repo.UpdateBlockStatus(data.BlockerID, data.BlockedID, true)
	if err != nil {
		// ถ้าไม่เคยมีข้อมูลเลย ให้สร้างใหม่
		block := entity.Block{
			BlockerID: data.BlockerID,
			BlockedID: data.BlockedID,
			Active:    true,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}
		s.Repo.CreateBlock(&block)
	}

	// ปฏิเสธคำขอที่เป็น Pending ทั้งหมดระหว่างคู่นี้ทันที
	s.Repo.RejectPendingRequestsBetween(data.BlockerID, data.BlockedID)

	// เลิกเป็นเพื่อนอัตโนมัติ (Active = false)
	s.Repo.UpdateRelationActive(data.BlockerID, data.BlockedID, false)

	//  เลิกติดตามอัตโนมัติทั้ง 2 ฝั่ง (Status 3 = Unfollowed)
	s.Repo.UpdateFollowStatus(data.BlockerID, data.BlockedID, 3) // เราเลิกตามเขา
	s.Repo.UpdateFollowStatus(data.BlockedID, data.BlockerID, 3) // เขาเลิกตามเรา (เพราะโดนบล็อก)

	return nil
}

func (s *FriendService) Unblock(data dto.UnblockDTO) error {
	// เลิกบล็อกคือเปลี่ยน Active เป็น false (0) และอัปเดตเวลา
	// ข้อมูลจะยังอยู่ใน DB ไม่ได้ถูกลบออก
	return s.Repo.UpdateBlockStatus(data.BlockerID, data.BlockedID, false)
}

func (s *FriendService) GetMyBlockedList(memberID int) ([]entity.Member, error) {
	// เรียก Repo เพื่อดึงรายชื่อคนที่เราบล็อก
	users, err := s.Repo.GetBlockedUsers(memberID)
	if err != nil {
		return nil, errors.New("ไม่สามารถดึงรายการที่บล็อกได้")
	}
	return users, nil
}

// ---------------------- Follow -------------------

func (s *FriendService) Follow(data dto.FollowDTO) error {
	if data.FollowerID == data.FollowedID {
		return errors.New("ไม่สามารถติดตามตนเองได้")
	}
	// อัปเดตสถานะเป็น 1 (Following) และเวลา UpdatedAt
	err := s.Repo.UpdateFollowStatus(data.FollowerID, data.FollowedID, 1)
	if err == nil {
		return nil
	}

	follow := entity.Follow{
		FollowerID:     data.FollowerID,
		FollowedID:     data.FollowedID,
		FollowStatusID: 1,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}
	return s.Repo.CreateFollow(&follow)
}

func (s *FriendService) AutoFollow(followerID, followedID int) {
	// 1. ลองอัปเดตเป็นสถานะ 1 (Following) และอัปเดตเวลา
	err := s.Repo.UpdateFollowStatus(followerID, followedID, 1)
	if err != nil {
		// 2. ถ้าไม่มีข้อมูลเดิม ให้สร้างใหม่
		follow := entity.Follow{
			FollowerID:     followerID,
			FollowedID:     followedID,
			FollowStatusID: 1,
			CreatedAt:      time.Now(),
			UpdatedAt:      time.Now(), // บันทึกเวลาเริ่มต้น
		}
		s.Repo.CreateFollow(&follow)
	}
}

func (s *FriendService) Unfollow(data dto.UnfollowDTO) error {
	// อัปเดตสถานะเป็น Unfollowed (3) แทนการลบ
	return s.Repo.UpdateFollowStatus(data.FollowerID, data.FollowedID, 3)
}

func (s *FriendService) Mute(data dto.MuteDTO) error {
	return s.Repo.UpdateFollowStatus(data.FollowerID, data.FollowedID, 2) // 2: Muted
}

func (s *FriendService) Unmute(data dto.UnmuteDTO) error {
	return s.Repo.UpdateFollowStatus(data.FollowerID, data.FollowedID, 1) // 1: Following
}

func (s *FriendService) GetPopularMembers(myID int) ([]entity.Member, error) {
	return s.Repo.GetPopularMembers(myID)
}

func (s *FriendService) GetAllMembers(myID int) ([]entity.Member, error) {
	return s.Repo.GetAllMembers(myID)
}
