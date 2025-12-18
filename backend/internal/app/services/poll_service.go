package services

import (
	"errors"
	"time"

	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/dto"
	"github.com/sut68/team12/backend/internal/entity"
)

type PollService interface {
	// Member - DRAFT management
	SaveDraft(memberID uint, req dto.CreatePollRequest) (*dto.PollResponse, error)
	UpdateDraft(memberID uint, pollID uint, req dto.UpdatePollRequest) (*dto.PollResponse, error)
	SubmitForReview(memberID uint, pollID uint) (*dto.PollResponse, error)
	CancelRequest(memberID uint, pollID uint) (*dto.PollResponse, error)
	DeletePoll(memberID uint, pollID uint) error

	// Member - My Polls
	GetMyPolls(memberID uint, statusID *uint) ([]dto.MyPollsResponse, error)
	GetMyPollByID(memberID uint, pollID uint) (*dto.PollResponse, error)

	// Member - Public (keep existing)
	CreateRequest(memberID uint, req dto.CreatePollRequest) (*dto.PollResponse, error) // Deprecated: Use SaveDraft + SubmitForReview
	ListPublished() ([]dto.PollResponse, error)
	Vote(memberID uint, pollID uint, req dto.VotePollRequest) (*dto.VotePollResponse, error)
	Results(pollID uint) (*dto.PollResultsResponse, error)

	// Admin
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
   MEMBER - DRAFT MANAGEMENT
========================= */

const (
	StatusDRAFT          = uint(1)
	StatusPENDING_REVIEW = uint(2)
	StatusPUBLISHED      = uint(3)
	StatusREJECTED       = uint(4)
	StatusCLOSED         = uint(5)
	StatusCANCELED       = uint(6)
)

// SaveDraft: บันทึกโพลเป็น DRAFT (ไม่ต้อง validate เข้มงวด)
func (s *pollService) SaveDraft(memberID uint, req dto.CreatePollRequest) (*dto.PollResponse, error) {
	poll := entity.Poll{
		Question:        req.Question,
		AllowMultiple:   req.AllowMultiple,
		MaxChoice:       req.MaxChoice,
		StartAt:         req.StartAt,
		EndAt:           req.EndAt,
		MainCategoryID:  req.MainCategoryID,
		SubCategoryL1ID: req.SubCategoryL1ID,
		SubCategoryL2ID: req.SubCategoryL2ID,
		MemberID:        memberID,
		PollStatusID:    StatusDRAFT,
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

	// Log history
	s.pollRepo.CreateHistory(&entity.PollHistory{
		Action:     "SAVE_DRAFT",
		PollID:     poll.ID,
		ToStatusID: &poll.PollStatusID,
	})

	return mapPollToResponse(&poll), nil
}

// UpdateDraft: แก้ไขโพลที่เป็น DRAFT หรือ REJECTED
func (s *pollService) UpdateDraft(memberID uint, pollID uint, req dto.UpdatePollRequest) (*dto.PollResponse, error) {
	poll, err := s.pollRepo.GetPollByID(pollID)
	if err != nil {
		return nil, err
	}

	// ตรวจสอบ ownership
	if poll.MemberID != memberID {
		return nil, errors.New("you are not the owner of this poll")
	}

	// ตรวจสอบสถานะ: แก้ไขได้เฉพาะ DRAFT หรือ REJECTED
	if poll.PollStatusID != StatusDRAFT && poll.PollStatusID != StatusREJECTED {
		return nil, errors.New("can only update poll in DRAFT or REJECTED status")
	}

	oldStatusID := poll.PollStatusID

	// อัปเดตข้อมูล
	poll.Question = req.Question
	poll.AllowMultiple = req.AllowMultiple
	poll.MaxChoice = req.MaxChoice
	poll.StartAt = req.StartAt
	poll.EndAt = req.EndAt
	poll.MainCategoryID = req.MainCategoryID
	poll.SubCategoryL1ID = req.SubCategoryL1ID
	poll.SubCategoryL2ID = req.SubCategoryL2ID

	// ลบ options เดิมแล้วสร้างใหม่ (ทำให้ง่ายขึ้น)
	if err := s.pollRepo.DeletePoll(pollID); err == nil {
		poll.Options = nil
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
	}

	if err := s.pollRepo.UpdatePoll(poll); err != nil {
		return nil, err
	}

	// Log history
	s.pollRepo.CreateHistory(&entity.PollHistory{
		Action:       "UPDATE_DRAFT",
		PollID:       poll.ID,
		FromStatusID: &oldStatusID,
		ToStatusID:   &poll.PollStatusID,
	})

	return mapPollToResponse(poll), nil
}

// SubmitForReview: ส่งโพลให้แอดมินตรวจ (validate เข้มงวด)
func (s *pollService) SubmitForReview(memberID uint, pollID uint) (*dto.PollResponse, error) {
	poll, err := s.pollRepo.GetPollByID(pollID)
	if err != nil {
		return nil, err
	}

	if poll.MemberID != memberID {
		return nil, errors.New("you are not the owner of this poll")
	}

	// ต้องเป็น DRAFT เท่านั้น
	if poll.PollStatusID != StatusDRAFT {
		return nil, errors.New("can only submit poll in DRAFT status")
	}

	// Strict validation
	if err := validatePollForSubmission(poll); err != nil {
		return nil, err
	}

	oldStatusID := poll.PollStatusID
	poll.PollStatusID = StatusPENDING_REVIEW

	if err := s.pollRepo.UpdatePoll(poll); err != nil {
		return nil, err
	}

	// Log history
	s.pollRepo.CreateHistory(&entity.PollHistory{
		Action:       "SUBMIT",
		PollID:       poll.ID,
		FromStatusID: &oldStatusID,
		ToStatusID:   &poll.PollStatusID,
	})

	return mapPollToResponse(poll), nil
}

// CancelRequest: ยกเลิกคำขอ (PENDING_REVIEW → CANCELED)
func (s *pollService) CancelRequest(memberID uint, pollID uint) (*dto.PollResponse, error) {
	poll, err := s.pollRepo.GetPollByID(pollID)
	if err != nil {
		return nil, err
	}

	if poll.MemberID != memberID {
		return nil, errors.New("you are not the owner of this poll")
	}

	if poll.PollStatusID != StatusPENDING_REVIEW {
		return nil, errors.New("can only cancel poll in PENDING_REVIEW status")
	}

	oldStatusID := poll.PollStatusID
	poll.PollStatusID = StatusCANCELED

	if err := s.pollRepo.UpdatePoll(poll); err != nil {
		return nil, err
	}

	// Log history
	s.pollRepo.CreateHistory(&entity.PollHistory{
		Action:       "CANCEL",
		PollID:       poll.ID,
		FromStatusID: &oldStatusID,
		ToStatusID:   &poll.PollStatusID,
	})

	return mapPollToResponse(poll), nil
}

// DeletePoll: ลบโพล (เฉพาะ DRAFT หรือ REJECTED)
func (s *pollService) DeletePoll(memberID uint, pollID uint) error {
	poll, err := s.pollRepo.GetPollByID(pollID)
	if err != nil {
		return err
	}

	if poll.MemberID != memberID {
		return errors.New("you are not the owner of this poll")
	}

	// ลบได้เฉพาะ DRAFT หรือ REJECTED
	if poll.PollStatusID != StatusDRAFT && poll.PollStatusID != StatusREJECTED {
		return errors.New("can only delete poll in DRAFT or REJECTED status")
	}

	return s.pollRepo.DeletePoll(pollID)
}

/* =========================
   MEMBER - MY POLLS
========================= */

// GetMyPolls: ดูโพลของตัวเอง (filter ได้ตามสถานะ)
func (s *pollService) GetMyPolls(memberID uint, statusID *uint) ([]dto.MyPollsResponse, error) {
	polls, err := s.pollRepo.ListPollsByMember(memberID, statusID)
	if err != nil {
		return nil, err
	}

	var result []dto.MyPollsResponse
	for _, poll := range polls {
		statusName := ""
		if poll.PollStatus != nil {
			statusName = poll.PollStatus.Name
		}

		result = append(result, dto.MyPollsResponse{
			ID:               poll.ID,
			Question:         poll.Question,
			StatusID:         poll.PollStatusID,
			StatusName:       statusName,
			LastRejectReason: poll.LastRejectReason,
			CreatedAt:        poll.CreatedAt,
			StartAt:          poll.StartAt,
			EndAt:            poll.EndAt,
		})
	}

	return result, nil
}

// GetMyPollByID: ดูโพลของตัวเอง (ต้องเป็น owner)
func (s *pollService) GetMyPollByID(memberID uint, pollID uint) (*dto.PollResponse, error) {
	poll, err := s.pollRepo.GetPollByID(pollID)
	if err != nil {
		return nil, err
	}

	if poll.MemberID != memberID {
		return nil, errors.New("you are not the owner of this poll")
	}

	return mapPollToResponse(poll), nil
}

/* =========================
   MEMBER - PUBLIC (EXISTING)
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
	poll, err := s.pollRepo.GetPollByID(pollID)
	if err != nil {
		return nil, err
	}

	oldStatusID := poll.PollStatusID
	poll.PollStatusID = StatusPUBLISHED

	if err := s.pollRepo.UpdatePoll(poll); err != nil {
		return nil, err
	}

	// Log history
	s.pollRepo.CreateHistory(&entity.PollHistory{
		Action:       "APPROVE",
		PollID:       poll.ID,
		AdminID:      &adminID,
		FromStatusID: &oldStatusID,
		ToStatusID:   &poll.PollStatusID,
	})

	return mapPollToResponse(poll), nil
}

func (s *pollService) Reject(adminID uint, pollID uint, reason string) (*dto.PollResponse, error) {
	poll, err := s.pollRepo.GetPollByID(pollID)
	if err != nil {
		return nil, err
	}

	oldStatusID := poll.PollStatusID
	poll.PollStatusID = StatusREJECTED
	poll.LastRejectReason = reason

	if err := s.pollRepo.UpdatePoll(poll); err != nil {
		return nil, err
	}

	// Log history
	s.pollRepo.CreateHistory(&entity.PollHistory{
		Action:       "REJECT",
		PollID:       poll.ID,
		AdminID:      &adminID,
		Reason:       reason,
		FromStatusID: &oldStatusID,
		ToStatusID:   &poll.PollStatusID,
	})

	return mapPollToResponse(poll), nil
}

func (s *pollService) Close(adminID uint, pollID uint) (*dto.PollResponse, error) {
	poll, err := s.pollRepo.GetPollByID(pollID)
	if err != nil {
		return nil, err
	}

	oldStatusID := poll.PollStatusID
	poll.PollStatusID = StatusCLOSED

	if err := s.pollRepo.UpdatePoll(poll); err != nil {
		return nil, err
	}

	// Log history
	s.pollRepo.CreateHistory(&entity.PollHistory{
		Action:       "CLOSE",
		PollID:       poll.ID,
		AdminID:      &adminID,
		FromStatusID: &oldStatusID,
		ToStatusID:   &poll.PollStatusID,
	})

	return mapPollToResponse(poll), nil
}

/* =========================
   HELPERS
========================= */

// validatePollForSubmission: Strict validation สำหรับตอนส่งตรวจ
func validatePollForSubmission(poll *entity.Poll) error {
	if poll.Question == "" {
		return errors.New("question is required")
	}

	if len(poll.Options) < 2 {
		return errors.New("at least 2 options required")
	}

	// ตรวจสอบตัวเลือกซ้ำ
	seen := make(map[string]bool)
	for _, opt := range poll.Options {
		if opt.Label == "" {
			return errors.New("option label cannot be empty")
		}
		if seen[opt.Label] {
			return errors.New("duplicate option labels not allowed")
		}
		seen[opt.Label] = true
	}

	// ตรวจสอบ MaxChoice
	if poll.AllowMultiple {
		if poll.MaxChoice == nil {
			return errors.New("max_choice must be specified when allow_multiple is true")
		}
		if *poll.MaxChoice <= 1 || *poll.MaxChoice > len(poll.Options) {
			return errors.New("max_choice must be between 2 and number of options")
		}
	}

	// ตรวจสอบ Start/End dates
	if poll.StartAt != nil && poll.EndAt != nil {
		if poll.EndAt.Before(*poll.StartAt) {
			return errors.New("end_at must be after start_at")
		}
	}

	return nil
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
