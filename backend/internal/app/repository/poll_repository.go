package repository

import (
	"gorm.io/gorm"

	"github.com/sut68/team12/backend/internal/entity"
)

type PollRepository interface {
	CreatePoll(poll *entity.Poll) error
	GetPollByID(id uint) (*entity.Poll, error)
	ListPolls(statusID *uint, search *string) ([]entity.Poll, error)
	ListPollsByMember(memberID uint, statusID *uint) ([]entity.Poll, error)
	UpdatePoll(poll *entity.Poll) error
	DeletePoll(pollID uint) error

	// Voting
	HasVoted(pollID uint, memberID uint) (bool, error)
	CountValidOptions(pollID uint, optionIDs []uint) (int64, error)
	CreateVoteWithOptions(pollID uint, memberID uint, optionIDs []uint) (*entity.PollVote, error)

	// Results
	CountVotesByOption(pollID uint) ([]PollResultRow, error)
	CountTotalVoters(pollID uint) (int64, error)

	// History
	CreateHistory(history *entity.PollHistory) error

	// UpdatePollStatus updates the status of a poll
	UpdatePollStatus(pollID uint, statusID uint) error

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

func (r *pollRepository) UpdatePoll(poll *entity.Poll) error {
	return r.db.Save(poll).Error
}

func (r *pollRepository) DeletePoll(pollID uint) error {
	return r.db.Delete(&entity.Poll{}, pollID).Error
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

func (r *pollRepository) CountValidOptions(pollID uint, optionIDs []uint) (int64, error) {
	var count int64
	err := r.db.Model(&entity.PollOption{}).
		Where("poll_id = ? AND id IN ?", pollID, optionIDs).
		Count(&count).Error
	return count, err
}

func (r *pollRepository) CreateVoteWithOptions(pollID uint, memberID uint, optionIDs []uint) (*entity.PollVote, error) {
	var created entity.PollVote

	err := r.db.Transaction(func(tx *gorm.DB) error {
		created = entity.PollVote{
			PollID:   pollID,
			MemberID: memberID,
		}
		if err := tx.Create(&created).Error; err != nil {
			return err
		}

		rows := make([]entity.PollVoteOption, 0, len(optionIDs))
		for _, oid := range optionIDs {
			rows = append(rows, entity.PollVoteOption{
				PollVoteID:   created.ID,
				PollOptionID: oid,
			})
		}
		if err := tx.Create(&rows).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, err
	}
	return &created, nil
}

/* =========================
   RESULTS (✅ แบบ B: นับจำนวนคน)
========================= */

type PollResultRow struct {
	OptionID uint
	Label    string
	ImgURL   string
	Count    int64 // ✅ จำนวน “คน” ที่เลือก option นี้
}

func (r *pollRepository) CountTotalVoters(pollID uint) (int64, error) {
	var total int64
	err := r.db.Model(&entity.PollVote{}).
		Where("poll_id = ?", pollID).
		Count(&total).Error
	return total, err
}

// ✅ return ทุก option (รวม 0 คะแนน) + นับจาก poll_vote_options
func (r *pollRepository) CountVotesByOption(pollID uint) ([]PollResultRow, error) {
	var results []PollResultRow

	err := r.db.
		Table("poll_options po").
		Select(`
			po.id AS option_id,
			po.label AS label,
			po.img_url AS img_url,
			COALESCE(COUNT(DISTINCT pv.id), 0) AS count
		`).
		Joins("LEFT JOIN poll_vote_options pvo ON pvo.poll_option_id = po.id").
		Joins("LEFT JOIN poll_votes pv ON pv.id = pvo.poll_vote_id AND pv.poll_id = ?", pollID).
		Where("po.poll_id = ?", pollID).
		Group("po.id, po.label, po.img_url, po.sort_order").
		Order("po.sort_order ASC, po.id ASC").
		Scan(&results).Error

	return results, err
}

/* =========================
   HISTORY
========================= */

func (r *pollRepository) CreateHistory(history *entity.PollHistory) error {
	return r.db.Create(history).Error
}


/* =========================
   UPDATE POLL STATUS
========================= */
func (r *pollRepository) UpdatePollStatus(pollID uint, statusID uint) error {
	return r.db.Model(&entity.Poll{}).
		Where("id = ?", pollID).
		Update("poll_status_id", statusID).Error
}