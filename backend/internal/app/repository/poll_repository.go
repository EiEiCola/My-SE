package repository

import (
	"gorm.io/gorm"

	"github.com/sut68/team12/backend/internal/entity"
)

type PollRepository interface {
	CreatePoll(poll *entity.Poll) error
	GetPollByID(id uint) (*entity.Poll, error)
	ListPolls(statusID *uint, search *string) ([]entity.Poll, error)
	ListPollsByMember(memberID uint, statusID *uint) ([]entity.Poll, error) // NEW: My Polls
	UpdatePoll(poll *entity.Poll) error
	DeletePoll(pollID uint) error // NEW: Delete poll

	HasVoted(pollID uint, memberID uint) (bool, error)
	CreateVotes(votes []entity.PollVote) error

	CountVotesByOption(pollID uint) ([]PollResultRow, error)

	// NEW: Poll History
	CreateHistory(history *entity.PollHistory) error
}

type pollRepository struct {
	db *gorm.DB
}

func NewPollRepository(db *gorm.DB) PollRepository {
	return &pollRepository{db: db}
}

/* =========================
   POLL
========================= */

func (r *pollRepository) CreatePoll(poll *entity.Poll) error {
	return r.db.Create(poll).Error
}

func (r *pollRepository) GetPollByID(id uint) (*entity.Poll, error) {
	var poll entity.Poll
	err := r.db.
		Preload("Options").
		Preload("PollStatus").
		First(&poll, id).Error
	if err != nil {
		return nil, err
	}
	return &poll, nil
}

func (r *pollRepository) ListPolls(statusID *uint, search *string) ([]entity.Poll, error) {
	var polls []entity.Poll

	query := r.db.
		Preload("Options").
		Preload("PollStatus").
		Model(&entity.Poll{})

	if statusID != nil {
		query = query.Where("poll_status_id = ?", *statusID)
	}

	if search != nil && *search != "" {
		query = query.Where("question LIKE ?", "%"+*search+"%")
	}

	err := query.Order("created_at DESC").Find(&polls).Error
	return polls, err
}

func (r *pollRepository) UpdatePoll(poll *entity.Poll) error {
	return r.db.Save(poll).Error
}

/* =========================
   VOTE
========================= */

func (r *pollRepository) HasVoted(pollID uint, memberID uint) (bool, error) {
	var count int64
	err := r.db.Model(&entity.PollVote{}).
		Where("poll_id = ? AND member_id = ?", pollID, memberID).
		Count(&count).Error
	return count > 0, err
}

func (r *pollRepository) CreateVotes(votes []entity.PollVote) error {
	return r.db.Create(&votes).Error
}

/* =========================
   RESULTS
========================= */

type PollResultRow struct {
	OptionID uint
	Label    string
	ImgURL   string
	Count    int64
}

func (r *pollRepository) CountVotesByOption(pollID uint) ([]PollResultRow, error) {
	var results []PollResultRow

	err := r.db.
		Table("poll_votes").
		Select(`
			poll_options.id AS option_id,
			poll_options.label AS label,
			poll_options.img_url AS img_url,
			COUNT(poll_votes.id) AS count
		`).
		Joins("JOIN poll_options ON poll_votes.poll_option_id = poll_options.id").
		Where("poll_votes.poll_id = ?", pollID).
		Group("poll_options.id, poll_options.label, poll_options.img_url").
		Scan(&results).Error

	return results, err
}

/* =========================
   MY POLLS (MEMBER)
========================= */

func (r *pollRepository) ListPollsByMember(memberID uint, statusID *uint) ([]entity.Poll, error) {
	var polls []entity.Poll

	query := r.db.
		Preload("Options").
		Preload("PollStatus").
		Model(&entity.Poll{}).
		Where("member_id = ?", memberID)

	if statusID != nil {
		query = query.Where("poll_status_id = ?", *statusID)
	}

	err := query.Order("created_at DESC").Find(&polls).Error
	return polls, err
}

func (r *pollRepository) DeletePoll(pollID uint) error {
	return r.db.Delete(&entity.Poll{}, pollID).Error
}

/* =========================
   POLL HISTORY
========================= */

func (r *pollRepository) CreateHistory(history *entity.PollHistory) error {
	return r.db.Create(history).Error
}
