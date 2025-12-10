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
	return s.Repo.CreateBlock(&block)
}
