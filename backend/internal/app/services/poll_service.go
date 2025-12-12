package services

import (
	"errors"
	"time"

	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/dto"
	"github.com/sut68/team12/backend/internal/entity"
)

type PollService interface {
	// member
	CreateRequest(memberID uint, req dto.CreatePollRequest) (*dto.PollResponse, error)
	ListPublished() ([]dto.PollResponse, error)
	Vote(memberID uint, pollID uint, req dto.VotePollRequest) (*dto.VotePollResponse, error)
	Results(pollID uint) (*dto.PollResultsResponse, error)

	// admin
	ListForAdmin(statusID *uint) ([]dto.PollResponse, error)
	Approve(adminID uint, pollID uint) (*dto.PollResponse, error)
	Reject(adminID uint, pollID uint, reason string) (*dto.PollResponse, error)
	Close(adminID uint, pollID uint) (*dto.PollResponse, error)
}

type pollService struct {
	pollRepo repository.PollRepository
}

func NewPollService(pollRepo repository.PollRepository) PollService {
	return &pollService{pollRepo: pollRepo}
}

/* =========================
   MEMBER
========================= */

func (s *pollService) CreateRequest(memberID uint, req dto.CreatePollRequest) (*dto.PollResponse, error) {
	// PENDING_REVIEW = 1
	pendingStatusID := uint(1)

	poll := entity.Poll{
		Question:      req.Question,
		AllowMultiple: req.AllowMultiple,
		MaxChoice:     req.MaxChoice,
		StartAt:       req.StartAt,
		EndAt:         req.EndAt,
		MemberID:      memberID,
		PollStatusID:  pendingStatusID,
	}

	for i, opt := range req.Options {
		sort := i
		if opt.SortOrder != nil {
			sort = *opt.SortOrder
		}

		poll.Options = append(poll.Options, entity.PollOption{
			Label:     opt.Label,
			ImgURL:    opt.ImgURL,
			SortOrder: sort,
		})
	}

	if err := s.pollRepo.CreatePoll(&poll); err != nil {
		return nil, err
	}

	return mapPollToResponse(&poll), nil
}

func (s *pollService) ListPublished() ([]dto.PollResponse, error) {
	// PUBLISHED = 2
	publishedStatusID := uint(2)

	polls, err := s.pollRepo.ListPolls(&publishedStatusID, nil)
	if err != nil {
		return nil, err
	}

	return mapPollsToResponse(polls), nil
}

func (s *pollService) Vote(memberID uint, pollID uint, req dto.VotePollRequest) (*dto.VotePollResponse, error) {
	poll, err := s.pollRepo.GetPollByID(pollID)
	if err != nil {
		return nil, err
	}

	// PUBLISHED = 2
	publishedStatusID := uint(2)
	if poll.PollStatusID != publishedStatusID {
		return nil, errors.New("poll is not open for voting")
	}

	now := time.Now()
	if poll.StartAt != nil && now.Before(*poll.StartAt) {
		return nil, errors.New("poll has not started")
	}
	if poll.EndAt != nil && now.After(*poll.EndAt) {
		return nil, errors.New("poll has ended")
	}

	voted, err := s.pollRepo.HasVoted(pollID, memberID)
	if err != nil {
		return nil, err
	}
	if voted {
		return nil, errors.New("you already voted this poll")
	}

	if !poll.AllowMultiple && len(req.OptionIDs) != 1 {
		return nil, errors.New("only one option is allowed")
	}
	if poll.AllowMultiple && poll.MaxChoice != nil && len(req.OptionIDs) > *poll.MaxChoice {
		return nil, errors.New("exceed max choice")
	}

	var votes []entity.PollVote
	for _, optID := range req.OptionIDs {
		votes = append(votes, entity.PollVote{
			PollID:       pollID,
			PollOptionID: optID,
			MemberID:     memberID,
			VotedAt:      time.Now(),
		})
	}

	if err := s.pollRepo.CreateVotes(votes); err != nil {
		return nil, err
	}

	return &dto.VotePollResponse{
		PollID:    pollID,
		MemberID:  memberID,
		OptionIDs: req.OptionIDs,
		Message:   "vote_success",
	}, nil
}

func (s *pollService) Results(pollID uint) (*dto.PollResultsResponse, error) {
	poll, err := s.pollRepo.GetPollByID(pollID)
	if err != nil {
		return nil, err
	}

	rows, err := s.pollRepo.CountVotesByOption(pollID)
	if err != nil {
		return nil, err
	}

	var total int64
	for _, r := range rows {
		total += r.Count
	}

	var items []dto.PollResultItem
	for _, r := range rows {
		percent := 0.0
		if total > 0 {
			percent = float64(r.Count) * 100 / float64(total)
		}

		items = append(items, dto.PollResultItem{
			OptionID: r.OptionID,
			Label:    r.Label,
			ImgURL:   r.ImgURL,
			Count:    r.Count,
			Percent:  percent,
		})
	}

	return &dto.PollResultsResponse{
		PollID:   poll.ID,
		Question: poll.Question,
		Total:    total,
		Items:    items,
	}, nil
}

/* =========================
   ADMIN
========================= */

func (s *pollService) ListForAdmin(statusID *uint) ([]dto.PollResponse, error) {
	polls, err := s.pollRepo.ListPolls(statusID, nil)
	if err != nil {
		return nil, err
	}
	return mapPollsToResponse(polls), nil
}

func (s *pollService) Approve(adminID uint, pollID uint) (*dto.PollResponse, error) {
	// PUBLISHED = 2
	publishedStatusID := uint(2)

	poll, err := s.pollRepo.GetPollByID(pollID)
	if err != nil {
		return nil, err
	}

	poll.PollStatusID = publishedStatusID
	if err := s.pollRepo.UpdatePoll(poll); err != nil {
		return nil, err
	}

	return mapPollToResponse(poll), nil
}

func (s *pollService) Reject(adminID uint, pollID uint, reason string) (*dto.PollResponse, error) {
	// REJECTED = 3
	rejectedStatusID := uint(3)

	poll, err := s.pollRepo.GetPollByID(pollID)
	if err != nil {
		return nil, err
	}

	poll.PollStatusID = rejectedStatusID
	poll.LastRejectReason = reason

	if err := s.pollRepo.UpdatePoll(poll); err != nil {
		return nil, err
	}

	return mapPollToResponse(poll), nil
}

func (s *pollService) Close(adminID uint, pollID uint) (*dto.PollResponse, error) {
	// CLOSED = 4
	closedStatusID := uint(4)

	poll, err := s.pollRepo.GetPollByID(pollID)
	if err != nil {
		return nil, err
	}

	poll.PollStatusID = closedStatusID
	if err := s.pollRepo.UpdatePoll(poll); err != nil {
		return nil, err
	}

	return mapPollToResponse(poll), nil
}

/* =========================
   MAPPER
========================= */

func mapPollToResponse(poll *entity.Poll) *dto.PollResponse {
	res := &dto.PollResponse{
		ID:       poll.ID,
		Question: poll.Question,
		StatusID: poll.PollStatusID,
		MemberID: poll.MemberID,

		AllowMultiple: poll.AllowMultiple,
		MaxChoice:     poll.MaxChoice,
		StartAt:       poll.StartAt,
		EndAt:         poll.EndAt,

		LastRejectReason: poll.LastRejectReason,
		CreatedAt:        poll.CreatedAt,
	}

	for _, opt := range poll.Options {
		res.Options = append(res.Options, dto.PollOptionResponse{
			ID:        opt.ID,
			Label:     opt.Label,
			ImgURL:    opt.ImgURL,
			SortOrder: opt.SortOrder,
		})
	}

	return res
}

func mapPollsToResponse(polls []entity.Poll) []dto.PollResponse {
	var res []dto.PollResponse
	for _, p := range polls {
		res = append(res, *mapPollToResponse(&p))
	}
	return res
}
