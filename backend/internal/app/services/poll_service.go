package services

import (
	"errors"
	"sort"
	"strings"
	"time"

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
	ListPublished(memberID uint) ([]dto.PollResponse, error)
	Vote(memberID uint, pollID uint, req dto.VotePollRequest) (*dto.VotePollResponse, error)
	Results(memberID uint, pollID uint) (*dto.PollResultsResponse, error)

	GetPublishedByID(memberID uint, pollID uint) (*dto.PollResponse, error)
	GetMyVote(memberID uint, pollID uint) (*dto.MyVoteResponse, error)

	ListForAdmin(statusID *uint) ([]dto.PollResponse, error)
	Approve(adminID uint, pollID uint) (*dto.PollResponse, error)
	Reject(adminID uint, pollID uint, reason string) (*dto.PollResponse, error)
	Close(adminID uint, pollID uint) (*dto.PollResponse, error)
	GetByIDForAdmin(pollID uint) (*dto.PollResponse, error)
	DeleteForAdmin(adminID uint, pollID uint) (*dto.PollResponse, error)
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
		sortOrder := i + 1
		if opt.SortOrder != nil {
			sortOrder = *opt.SortOrder
		}
		poll.Options = append(poll.Options, entity.PollOption{
			Label:     opt.Label,
			ImgURL:    opt.ImgURL,
			SortOrder: sortOrder,
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

	poll.Question = req.Question
	poll.AllowMultiple = req.AllowMultiple
	poll.MaxChoice = req.MaxChoice
	poll.StartAt = req.StartAt
	poll.EndAt = req.EndAt
	poll.MainCategoryID = req.MainCategoryID
	poll.SubCategoryL1ID = req.SubCategoryL1ID
	poll.SubCategoryL2ID = req.SubCategoryL2ID

	if oldStatusID == StatusREJECTED {
		poll.PollStatusID = StatusDRAFT
		poll.LastRejectReason = ""
	}

	if err := s.pollRepo.UpdatePoll(poll); err != nil {
		return nil, err
	}

	opts := make([]entity.PollOption, 0, len(req.Options))
	for i, opt := range req.Options {
		sortOrder := i + 1
		if opt.SortOrder != nil {
			sortOrder = *opt.SortOrder
		}
		opts = append(opts, entity.PollOption{
			Label:     opt.Label,
			ImgURL:    opt.ImgURL,
			SortOrder: sortOrder,
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
	if poll.PollStatusID != StatusDRAFT && poll.PollStatusID != StatusREJECTED {
		return nil, errors.New("can only submit poll in DRAFT or REJECTED status")
	}
	if err := validatePollForSubmission(poll); err != nil {
		return nil, err
	}

	poll.LastRejectReason = ""
	_ = s.pollRepo.UpdatePoll(poll)

	oldStatusID := poll.PollStatusID
	newStatusID := StatusPENDING_REVIEW

	if err := s.pollRepo.UpdatePollStatus(poll.ID, newStatusID); err != nil {
		return nil, err
	}

	_ = s.pollRepo.CreateHistory(&entity.PollHistory{
		Action:       "SUBMIT",
		PollID:       poll.ID,
		FromStatusID: &oldStatusID,
		ToStatusID:   &newStatusID,
	})

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

	if err := s.pollRepo.UpdatePollStatus(poll.ID, newStatusID); err != nil {
		return nil, err
	}

	_ = s.pollRepo.CreateHistory(&entity.PollHistory{
		Action:       "WITHDRAW",
		PollID:       poll.ID,
		FromStatusID: &oldStatusID,
		ToStatusID:   &newStatusID,
	})

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
			MainCategoryID:   poll.MainCategoryID,
			SubCategoryL1ID:  poll.SubCategoryL1ID,
			SubCategoryL2ID:  poll.SubCategoryL2ID,
		})
	}
	return result, nil
}

func (s *pollService) GetMyPollByID(memberID uint, pollID uint) (*dto.PollResponse, error) {
	poll, err := s.pollRepo.GetPollByID(pollID)
	if err != nil {
		return nil, err
	}
	// ❌ owner ห้ามโหวตโพลตัวเอง
	if poll.MemberID == memberID {
    return nil, errors.New("owner_cannot_vote")
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
		sortOrder := i
		if opt.SortOrder != nil {
			sortOrder = *opt.SortOrder
		}
		poll.Options = append(poll.Options, entity.PollOption{
			Label:     opt.Label,
			ImgURL:    opt.ImgURL,
			SortOrder: sortOrder,
		})
	}

	if err := s.pollRepo.CreatePoll(&poll); err != nil {
		return nil, err
	}
	return mapPollToResponse(&poll), nil
}

func (s *pollService) ListPublished(memberID uint) ([]dto.PollResponse, error) {
	statusID := StatusPUBLISHED
	polls, err := s.pollRepo.ListPolls(&statusID, nil)
	if err != nil {
		return nil, err
	}

	// ✅ ดึง pollIDs ทั้งหมดในฟีด
	pollIDs := make([]uint, 0, len(polls))
	for i := range polls {
		pollIDs = append(pollIDs, polls[i].ID)
	}

	// ✅ ดึง vote ของ user แบบ bulk: poll_id -> []option_id
	myVotes, err := s.pollRepo.GetMyVotesForPolls(pollIDs, memberID)
	if err != nil {
		return nil, err
	}

	// ✅ NEW: ดึงจำนวน “คนโหวต” ต่อโพล แบบ bulk: poll_id -> total_voters
	// ต้องมี method ใน repo: CountTotalVotersByPollIDs
	votersByPoll, err := s.pollRepo.CountTotalVotersByPollIDs(pollIDs)
	if err != nil {
		return nil, err
	}

	// map เป็น dto แล้วค่อยเติม fields เพิ่ม
	res := mapPollsToResponse(polls)

	for i := range res {
		pid := res[i].ID

		// has_voted + my_option_ids
		if optIDs, ok := myVotes[pid]; ok && len(optIDs) > 0 {
			res[i].HasVoted = true
			res[i].MyOptionIDs = optIDs
		} else {
			res[i].HasVoted = false
			res[i].MyOptionIDs = []uint{}
		}

		// ✅ total_voters
		if tv, ok := votersByPoll[pid]; ok {
			v := tv
			res[i].TotalVoters = &v
		} else {
			zero := int64(0)
			res[i].TotalVoters = &zero
		}
	}

	return res, nil
}

// ✅ Vote: 1 PollVote ต่อ poll+member และเลือกหลาย option ผ่าน PollVoteOption
func (s *pollService) Vote(memberID uint, pollID uint, req dto.VotePollRequest) (*dto.VotePollResponse, error) {
	poll, err := s.pollRepo.GetPollByID(pollID)
	if err != nil {
		return nil, err
	}
	if poll.MemberID == memberID {
        return nil, errors.New("owner_cannot_vote")
    }

	if poll.PollStatusID != StatusPUBLISHED {
		return nil, errors.New("poll_not_open")
	}

	now := time.Now()

	es := effectiveStart(poll)
	if es != nil && now.Before(*es) {
		return nil, errors.New("poll_not_started")
	}

	if poll.EndAt != nil && now.After(*poll.EndAt) {
		return nil, errors.New("poll_closed")
	}

	voted, err := s.pollRepo.HasVoted(pollID, memberID)
	if err != nil {
		return nil, err
	}
	if voted {
		return nil, errors.New("already_voted")
	}

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
		return nil, errors.New("option_ids_is_required")
	}

	if !poll.AllowMultiple {
		if len(optionIDs) != 1 {
			return nil, errors.New("only_one_option_is_allowed")
		}
	} else {
		if poll.MaxChoice != nil && len(optionIDs) > *poll.MaxChoice {
			return nil, errors.New("exceed_max_choice")
		}
	}

	validCount, err := s.pollRepo.CountValidOptions(pollID, optionIDs)
	if err != nil {
		return nil, err
	}
	if int(validCount) != len(optionIDs) {
		return nil, errors.New("invalid_option_id")
	}

	_, err = s.pollRepo.CreateVoteWithOptions(pollID, memberID, optionIDs)
	if err != nil {
		low := strings.ToLower(err.Error())
		if strings.Contains(low, "duplicate") || strings.Contains(low, "unique") {
			return nil, errors.New("already_voted")
		}
		return nil, err
	}

	results, err := s.Results(memberID, pollID)
	if err != nil {
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

	now := time.Now()
	cs := computedStatus(poll, now)

	if cs == "UPCOMING" {
		return nil, errors.New("results_not_available")
	}

	if cs == "CLOSED" || poll.PollStatusID == StatusCLOSED {
		// ok
	} else if poll.PollStatusID == StatusPUBLISHED {
		voted, err := s.pollRepo.HasVoted(pollID, memberID)
		if err != nil {
			return nil, err
		}
		if !voted {
			return nil, errors.New("must_vote_to_see_results")
		}
	} else {
		return nil, errors.New("results_not_available")
	}

	rows, err := s.pollRepo.CountVotesByOption(pollID)
	if err != nil {
		return nil, err
	}

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
		Total:    totalVoters,
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
	if poll.PollStatusID != StatusPENDING_REVIEW {
		return nil, errors.New("can only approve poll in PENDING_REVIEW status")
	}

	oldStatusID := poll.PollStatusID
	newStatusID := StatusPUBLISHED

	now := time.Now()

	if err := s.pollRepo.UpdatePollStatus(poll.ID, newStatusID); err != nil {
		return nil, err
	}
	if err := s.pollRepo.UpdatePublishedAt(poll.ID, now); err != nil {
		return nil, err
	}

	_ = s.pollRepo.CreateHistory(&entity.PollHistory{
		Action:       "APPROVE",
		PollID:       poll.ID,
		AdminID:      &adminID,
		FromStatusID: &oldStatusID,
		ToStatusID:   &newStatusID,
	})

	updated, err := s.pollRepo.GetPollByID(poll.ID)
	if err != nil {
		return nil, err
	}
	return mapPollToResponse(updated), nil
}

func (s *pollService) Reject(adminID uint, pollID uint, reason string) (*dto.PollResponse, error) {
	poll, err := s.pollRepo.GetPollByID(pollID)
	if err != nil {
		return nil, err
	}
	if poll.PollStatusID != StatusPENDING_REVIEW {
		return nil, errors.New("can only reject poll in PENDING_REVIEW status")
	}

	oldStatusID := poll.PollStatusID
	newStatusID := StatusREJECTED

	if err := s.pollRepo.RejectPoll(poll.ID, newStatusID, reason); err != nil {
		return nil, err
	}

	_ = s.pollRepo.CreateHistory(&entity.PollHistory{
		Action:       "REJECT",
		PollID:       poll.ID,
		AdminID:      &adminID,
		Reason:       reason,
		FromStatusID: &oldStatusID,
		ToStatusID:   &newStatusID,
	})

	updated, err := s.pollRepo.GetPollByID(poll.ID)
	if err != nil {
		return nil, err
	}
	return mapPollToResponse(updated), nil
}

func (s *pollService) Close(adminID uint, pollID uint) (*dto.PollResponse, error) {
	poll, err := s.pollRepo.GetPollByID(pollID)
	if err != nil {
		return nil, err
	}
	if poll.PollStatusID != StatusPUBLISHED {
		return nil, errors.New("can only close poll in PUBLISHED status")
	}

	oldStatusID := poll.PollStatusID
	newStatusID := StatusCLOSED

	if err := s.pollRepo.UpdatePollStatus(poll.ID, newStatusID); err != nil {
		return nil, err
	}

	_ = s.pollRepo.CreateHistory(&entity.PollHistory{
		Action:       "CLOSE",
		PollID:       poll.ID,
		AdminID:      &adminID,
		FromStatusID: &oldStatusID,
		ToStatusID:   &newStatusID,
	})

	updated, err := s.pollRepo.GetPollByID(poll.ID)
	if err != nil {
		return nil, err
	}
	return mapPollToResponse(updated), nil
}

func (s *pollService) GetByIDForAdmin(pollID uint) (*dto.PollResponse, error) {
	poll, err := s.pollRepo.GetPollByID(pollID)
	if err != nil {
		return nil, err
	}
	return mapPollToResponse(poll), nil
}

func (s *pollService) DeleteForAdmin(adminID uint, pollID uint) (*dto.PollResponse, error) {
	poll, err := s.pollRepo.GetPollByID(pollID)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	cs := computedStatus(poll, now)

	canDelete :=
		poll.PollStatusID == StatusDRAFT ||
			poll.PollStatusID == StatusREJECTED ||
			poll.PollStatusID == StatusCLOSED ||
			(poll.PollStatusID == StatusPUBLISHED && cs == "CLOSED")

	if !canDelete {
		return nil, errors.New("can only delete poll in DRAFT / REJECTED / CLOSED status")
	}

	_ = s.pollRepo.CreateHistory(&entity.PollHistory{
		Action:       "DELETE_ADMIN",
		PollID:       poll.ID,
		AdminID:      &adminID,
		FromStatusID: &poll.PollStatusID,
	})

	res := mapPollToResponse(poll)

	if err := s.pollRepo.DeletePoll(pollID); err != nil {
		return nil, err
	}

	return res, nil
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
	statusName := ""
	if poll.PollStatus != nil {
		statusName = poll.PollStatus.Name
	}

	authorName := "Community Poll"
	if poll.Member != nil {
		fn := strings.TrimSpace(poll.Member.FirstName)
		ln := strings.TrimSpace(poll.Member.LastName)

		if fn != "" || ln != "" {
			authorName = strings.TrimSpace(fn + " " + ln)
		} else if poll.Member.Username != "" {
			authorName = poll.Member.Username
		}
	}

	opts := poll.Options
	if opts == nil {
		opts = []entity.PollOption{}
	}
	sort.Slice(opts, func(i, j int) bool {
		return opts[i].SortOrder < opts[j].SortOrder
	})

	now := time.Now()
	es := effectiveStart(poll)
	cs := computedStatus(poll, now)

	res := &dto.PollResponse{
		ID:       poll.ID,
		Question: poll.Question,

		StatusID:   poll.PollStatusID,
		StatusName: statusName,

		MemberID:   poll.MemberID,
		AuthorName: authorName,

		AllowMultiple: poll.AllowMultiple,
		MaxChoice:     poll.MaxChoice,
		StartAt:       poll.StartAt,
		EndAt:         poll.EndAt,

		MainCategoryID:  poll.MainCategoryID,
		SubCategoryL1ID: poll.SubCategoryL1ID,
		SubCategoryL2ID: poll.SubCategoryL2ID,

		PublishedAt:      poll.PublishedAt,
		EffectiveStartAt: es,
		ComputedStatus:   cs,

		LastRejectReason: poll.LastRejectReason,
		CreatedAt:        poll.CreatedAt,

		Options: make([]dto.PollOptionResponse, 0, len(opts)),
	}

	// category objects
	if poll.MainCategoryID != nil && poll.MainCategory.ID != 0 {
		res.MainCategory = &dto.CategoryBrief{ID: poll.MainCategory.ID, Title: poll.MainCategory.Title}
	}
	if poll.SubCategoryL1ID != nil && poll.SubCategoryL1.ID != 0 {
		res.SubCategoryL1 = &dto.CategoryBrief{ID: poll.SubCategoryL1.ID, Title: poll.SubCategoryL1.Title}
	}
	if poll.SubCategoryL2ID != nil && poll.SubCategoryL2.ID != 0 {
		res.SubCategoryL2 = &dto.CategoryBrief{ID: poll.SubCategoryL2.ID, Title: poll.SubCategoryL2.Title}
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

// effectiveStart = max(start_at, published_at)
func effectiveStart(p *entity.Poll) *time.Time {
	if p == nil {
		return nil
	}
	if p.PublishedAt == nil && p.StartAt == nil {
		return nil
	}
	if p.PublishedAt == nil {
		return p.StartAt
	}
	if p.StartAt == nil {
		return p.PublishedAt
	}
	if p.StartAt.After(*p.PublishedAt) {
		return p.StartAt
	}
	return p.PublishedAt
}

func computedStatus(p *entity.Poll, now time.Time) string {
	es := effectiveStart(p)
	if p.EndAt != nil && now.After(*p.EndAt) {
		return "CLOSED"
	}
	if es != nil && now.Before(*es) {
		return "UPCOMING"
	}
	return "OPEN"
}

/* =========================
PUBLIC DETAIL (✅ ปรับเพิ่ม total_voters)
========================= */

func (s *pollService) GetPublishedByID(memberID uint, pollID uint) (*dto.PollResponse, error) {
	poll, err := s.pollRepo.GetPollByID(pollID)
	if err != nil {
		return nil, err
	}

	if poll.PollStatusID != StatusPUBLISHED && poll.PollStatusID != StatusCLOSED {
		return nil, errors.New("poll_not_found")
	}

	res := mapPollToResponse(poll)

	// ✅ เติม has_voted + my_option_ids
	myVotes, err := s.pollRepo.GetMyVotesForPolls([]uint{pollID}, memberID)
	if err != nil {
		return nil, err
	}
	if optIDs, ok := myVotes[pollID]; ok && len(optIDs) > 0 {
		res.HasVoted = true
		res.MyOptionIDs = optIDs
	} else {
		res.HasVoted = false
		res.MyOptionIDs = []uint{}
	}

	// ✅ NEW: เติม total_voters
	if tv, err := s.pollRepo.CountTotalVoters(pollID); err == nil {
		v := tv
		res.TotalVoters = &v
	}

	return res, nil
}

func (s *pollService) GetMyVote(memberID uint, pollID uint) (*dto.MyVoteResponse, error) {
	_, err := s.pollRepo.GetPollByID(pollID)
	if err != nil {
		return nil, err
	}

	myVotes, err := s.pollRepo.GetMyVotesForPolls([]uint{pollID}, memberID)
	if err != nil {
		return nil, err
	}

	optIDs := myVotes[pollID]
	if len(optIDs) == 0 {
		return &dto.MyVoteResponse{HasVoted: false, OptionIDs: []uint{}}, nil
	}
	return &dto.MyVoteResponse{HasVoted: true, OptionIDs: optIDs}, nil
}
