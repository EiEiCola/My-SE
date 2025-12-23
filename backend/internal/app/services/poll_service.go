package services

import (
	"errors"
	"strings"
	"time"
	"sort"

	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/dto"
	"github.com/sut68/team12/backend/internal/entity"
)

type PollService interface {
	SaveDraft(memberID uint, req dto.CreatePollRequest) (*dto.PollResponse, error)
	UpdateDraft(memberID uint, pollID uint, req dto.UpdatePollRequest) (*dto.PollResponse, error)
	SubmitForReview(memberID uint, pollID uint) (*dto.PollResponse, error)
	CancelRequest(memberID uint, pollID uint) (*dto.PollResponse, error)

	DeletePoll(memberID uint, pollID uint) error

	GetMyPolls(memberID uint, statusID *uint) ([]dto.MyPollsResponse, error)
	GetMyPollByID(memberID uint, pollID uint) (*dto.PollResponse, error)

	CreateRequest(memberID uint, req dto.CreatePollRequest) (*dto.PollResponse, error) // Deprecated
	ListPublished() ([]dto.PollResponse, error)
	Vote(memberID uint, pollID uint, req dto.VotePollRequest) (*dto.VotePollResponse, error)
	Results(memberID uint, pollID uint) (*dto.PollResultsResponse, error)

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
   STATUS CONST
========================= */

const (
	StatusDRAFT          = uint(1)
	StatusPENDING_REVIEW = uint(2)
	StatusPUBLISHED      = uint(3)
	StatusREJECTED       = uint(4)
	StatusCLOSED         = uint(5)
	StatusCANCELED       = uint(6)
)

/* =========================
   MEMBER - DRAFT MANAGEMENT
========================= */

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
    sort := i + 1 // ✅ เริ่มที่ 1
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

		_ = s.pollRepo.CreateHistory(&entity.PollHistory{
			Action:     "SAVE_DRAFT",
			PollID:     poll.ID,
			ToStatusID: &poll.PollStatusID,
		})

		return mapPollToResponse(&poll), nil
}

func (s *pollService) UpdateDraft(memberID uint, pollID uint, req dto.UpdatePollRequest) (*dto.PollResponse, error) {
	poll, err := s.pollRepo.GetPollByID(pollID)
	if err != nil {
		return nil, err
	}

	if poll.MemberID != memberID {
		return nil, errors.New("you are not the owner of this poll")
	}
	if poll.PollStatusID != StatusDRAFT && poll.PollStatusID != StatusREJECTED {
		return nil, errors.New("can only update poll in DRAFT or REJECTED status")
	}

	oldStatusID := poll.PollStatusID

	// 1) update poll fields (ไม่ยุ่ง options)
	poll.Question = req.Question
	poll.AllowMultiple = req.AllowMultiple
	poll.MaxChoice = req.MaxChoice
	poll.StartAt = req.StartAt
	poll.EndAt = req.EndAt
	poll.MainCategoryID = req.MainCategoryID
	poll.SubCategoryL1ID = req.SubCategoryL1ID
	poll.SubCategoryL2ID = req.SubCategoryL2ID

	if err := s.pollRepo.UpdatePoll(poll); err != nil {
		return nil, err
	}

	// 2) replace options จริง ๆ
	opts := make([]entity.PollOption, 0, len(req.Options))
	for i, opt := range req.Options {
		sort := i + 1
		if opt.SortOrder != nil {
			sort = *opt.SortOrder
		}
		opts = append(opts, entity.PollOption{
			Label:     opt.Label,
			ImgURL:    opt.ImgURL,
			SortOrder: sort,
		})
	}

	if err := s.pollRepo.ReplacePollOptions(pollID, opts); err != nil {
		return nil, err
	}

	_ = s.pollRepo.CreateHistory(&entity.PollHistory{
		Action:       "UPDATE_DRAFT",
		PollID:       poll.ID,
		FromStatusID: &oldStatusID,
		ToStatusID:   &poll.PollStatusID,
	})

	// 3) re-fetch ให้ options ล่าสุดชัวร์
	updated, err := s.pollRepo.GetPollByID(pollID)
	if err != nil {
		return nil, err
	}

	return mapPollToResponse(updated), nil
}

func (s *pollService) SubmitForReview(memberID uint, pollID uint) (*dto.PollResponse, error) {
	poll, err := s.pollRepo.GetPollByID(pollID)
	if err != nil {
		return nil, err
	}
	if poll.MemberID != memberID {
		return nil, errors.New("you are not the owner of this poll")
	}
	if poll.PollStatusID != StatusDRAFT {
		return nil, errors.New("can only submit poll in DRAFT status")
	}
	if err := validatePollForSubmission(poll); err != nil {
		return nil, err
	}

	oldStatusID := poll.PollStatusID
	newStatusID := StatusPENDING_REVIEW

	// ✅ แนะนำ: อัปเดต status แบบเจาะจง (ชัวร์กว่า UpdatePoll ทั่วไป)
	if err := s.pollRepo.UpdatePollStatus(poll.ID, newStatusID); err != nil {
		return nil, err
	}

	_ = s.pollRepo.CreateHistory(&entity.PollHistory{
		Action:       "SUBMIT",
		PollID:       poll.ID,
		FromStatusID: &oldStatusID,
		ToStatusID:   &newStatusID,
	})

	// ✅ สำคัญ: re-fetch เพื่อให้ poll_status_id / poll_status relation เป็นค่าล่าสุด
	updated, err := s.pollRepo.GetPollByID(poll.ID)
	if err != nil {
		return nil, err
	}

	return mapPollToResponse(updated), nil
}


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
	newStatusID := StatusDRAFT

	// ✅ update เฉพาะ poll_status_id ให้ชัวร์
	if err := s.pollRepo.UpdatePollStatus(poll.ID, newStatusID); err != nil {
		return nil, err
	}

	_ = s.pollRepo.CreateHistory(&entity.PollHistory{
		Action:       "WITHDRAW",
		PollID:       poll.ID,
		FromStatusID: &oldStatusID,
		ToStatusID:   &newStatusID,
	})

	// ✅ ดึงใหม่ให้ response เป็นค่าล่าสุดชัวร์
	updated, err := s.pollRepo.GetPollByID(poll.ID)
	if err != nil {
		return nil, err
	}

	return mapPollToResponse(updated), nil
}
func (s *pollService) DeletePoll(memberID uint, pollID uint) error {
	poll, err := s.pollRepo.GetPollByID(pollID)
	if err != nil {
		return err
	}
	if poll.MemberID != memberID {
		return errors.New("you are not the owner of this poll")
	}
	if poll.PollStatusID != StatusDRAFT && poll.PollStatusID != StatusREJECTED {
		return errors.New("can only delete poll in DRAFT or REJECTED status")
	}

	// (optional) เก็บ history
	_ = s.pollRepo.CreateHistory(&entity.PollHistory{
		Action:       "DELETE",
		PollID:       poll.ID,
		FromStatusID: &poll.PollStatusID,
	})

	return s.pollRepo.DeletePoll(pollID)
}




/* =========================
   MEMBER - MY POLLS
========================= */

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
   MEMBER - PUBLIC
========================= */

func (s *pollService) CreateRequest(memberID uint, req dto.CreatePollRequest) (*dto.PollResponse, error) {
	poll := entity.Poll{
		Question:      req.Question,
		AllowMultiple: req.AllowMultiple,
		MaxChoice:     req.MaxChoice,
		StartAt:       req.StartAt,
		EndAt:         req.EndAt,
		MemberID:      memberID,
		PollStatusID:  StatusPENDING_REVIEW,
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
	statusID := StatusPUBLISHED
	polls, err := s.pollRepo.ListPolls(&statusID, nil)
	if err != nil {
		return nil, err
	}
	return mapPollsToResponse(polls), nil
}

// ✅ Vote: 1 PollVote ต่อ poll+member และเลือกหลาย option ผ่าน PollVoteOption
func (s *pollService) Vote(memberID uint, pollID uint, req dto.VotePollRequest) (*dto.VotePollResponse, error) {
	poll, err := s.pollRepo.GetPollByID(pollID)
	if err != nil {
		return nil, err
	}

	if poll.PollStatusID != StatusPUBLISHED {
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
		return nil, errors.New("already voted")
	}

	// dedupe option_ids
	seen := map[uint]bool{}
	optionIDs := make([]uint, 0, len(req.OptionIDs))
	for _, id := range req.OptionIDs {
		if id == 0 {
			continue
		}
		if !seen[id] {
			seen[id] = true
			optionIDs = append(optionIDs, id)
		}
	}
	if len(optionIDs) == 0 {
		return nil, errors.New("option_ids is required")
	}

	if !poll.AllowMultiple {
		if len(optionIDs) != 1 {
			return nil, errors.New("only one option is allowed")
		}
	} else {
		if poll.MaxChoice != nil && len(optionIDs) > *poll.MaxChoice {
			return nil, errors.New("exceed max choice")
		}
	}

	validCount, err := s.pollRepo.CountValidOptions(pollID, optionIDs)
	if err != nil {
		return nil, err
	}
	if int(validCount) != len(optionIDs) {
		return nil, errors.New("invalid option id")
	}

	_, err = s.pollRepo.CreateVoteWithOptions(pollID, memberID, optionIDs)
	if err != nil {
		low := strings.ToLower(err.Error())
		if strings.Contains(low, "duplicate") || strings.Contains(low, "unique") {
			return nil, errors.New("already voted")
		}
		return nil, err
	}

	// ✅ Results แบบ B
	results, err := s.Results(memberID, pollID)
	if err != nil {
		// vote success แล้ว แต่ results error (ไม่ควรเกิด) — ส่ง vote success อย่างเดียวก็ได้
		return &dto.VotePollResponse{
			PollID:    pollID,
			MemberID:  memberID,
			OptionIDs: optionIDs,
			Message:   "vote_success",
		}, nil
	}

	return &dto.VotePollResponse{
		PollID:    pollID,
		MemberID:  memberID,
		OptionIDs: optionIDs,
		Message:   "vote_success",
		Results:   results,
	}, nil
}

func (s *pollService) Results(memberID uint, pollID uint) (*dto.PollResultsResponse, error) {
	poll, err := s.pollRepo.GetPollByID(pollID)
	if err != nil {
		return nil, err
	}

	switch poll.PollStatusID {
	case StatusCLOSED:
		// ok
	case StatusPUBLISHED:
		voted, err := s.pollRepo.HasVoted(pollID, memberID)
		if err != nil {
			return nil, err
		}
		if !voted {
			return nil, errors.New("must vote to see results")
		}
	default:
		return nil, errors.New("results not available")
	}

	rows, err := s.pollRepo.CountVotesByOption(pollID)
	if err != nil {
		return nil, err
	}

	// ✅ total = จำนวนคนโหวต (voters)
	totalVoters, err := s.pollRepo.CountTotalVoters(pollID)
	if err != nil {
		return nil, err
	}

	items := make([]dto.PollResultItem, 0, len(rows))
	for _, r := range rows {
		percent := 0.0
		if totalVoters > 0 {
			percent = float64(r.Count) * 100 / float64(totalVoters)
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
		Total:    totalVoters, // json:"total_votes" (ความหมายแบบ B)
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

	_ = s.pollRepo.CreateHistory(&entity.PollHistory{
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

	_ = s.pollRepo.CreateHistory(&entity.PollHistory{
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

	_ = s.pollRepo.CreateHistory(&entity.PollHistory{
		Action:       "CLOSE",
		PollID:       poll.ID,
		AdminID:      &adminID,
		FromStatusID: &oldStatusID,
		ToStatusID:   &poll.PollStatusID,
	})
	return mapPollToResponse(poll), nil
}

/* =========================
   HELPERS + MAPPER
========================= */

func validatePollForSubmission(poll *entity.Poll) error {
	if poll.Question == "" {
		return errors.New("question is required")
	}
	if len(poll.Options) < 2 {
		return errors.New("at least 2 options required")
	}

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

	if poll.AllowMultiple {
		if poll.MaxChoice == nil {
			return errors.New("max_choice must be specified when allow_multiple is true")
		}
		if *poll.MaxChoice <= 1 || *poll.MaxChoice > len(poll.Options) {
			return errors.New("max_choice must be between 2 and number of options")
		}
	}

	if poll.StartAt != nil && poll.EndAt != nil {
		if poll.EndAt.Before(*poll.StartAt) {
			return errors.New("end_at must be after start_at")
		}
	}

	return nil
}



func mapPollToResponse(poll *entity.Poll) *dto.PollResponse {
	// ✅ status_name
	statusName := ""
	if poll.PollStatus != nil {
		statusName = poll.PollStatus.Name
	}

	// ✅ กัน options nil + (optional) sort ตาม sort_order
	opts := poll.Options
	if opts == nil {
		opts = []entity.PollOption{}
	}
	sort.Slice(opts, func(i, j int) bool {
		return opts[i].SortOrder < opts[j].SortOrder
	})

	res := &dto.PollResponse{
		ID:       poll.ID,
		Question: poll.Question,

		StatusID:   poll.PollStatusID,
		StatusName: statusName, // ✅ เพิ่ม

		MemberID: poll.MemberID,

		AllowMultiple: poll.AllowMultiple,
		MaxChoice:     poll.MaxChoice,
		StartAt:       poll.StartAt,
		EndAt:         poll.EndAt,

		LastRejectReason: poll.LastRejectReason,
		CreatedAt:        poll.CreatedAt,

		Options: make([]dto.PollOptionResponse, 0, len(opts)), // ✅ กัน nil
	}

	for _, opt := range opts {
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
	res := make([]dto.PollResponse, 0, len(polls))
	for i := range polls {
		res = append(res, *mapPollToResponse(&polls[i]))
	}
	return res
}
