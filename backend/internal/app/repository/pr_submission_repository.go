package repository

import (
	"strings"

	"github.com/sut68/team12/backend/internal/entity"
	"github.com/sut68/team12/backend/internal/utils"
	"gorm.io/gorm"
)

type PRSubmissionRepository struct {
	DB *gorm.DB
}

func NewPRSubmissionRepository(db *gorm.DB) *PRSubmissionRepository {
	return &PRSubmissionRepository{DB: db}
}

func (r *PRSubmissionRepository) Create(sub *entity.PRSubmission) error {
	return r.DB.Create(sub).Error
}

func (r *PRSubmissionRepository) Update(sub *entity.PRSubmission) error {
	return r.DB.Save(sub).Error
}

func (r *PRSubmissionRepository) GetByID(id int) (*entity.PRSubmission, error) {
	var s entity.PRSubmission
	err := r.DB.Preload("Media").Preload("Reviews").Preload("Member").Where(&entity.PRSubmission{ID: id}).First(&s).Error
	if err != nil {
		return nil, err
	}
	return &s, nil
}

// ListByMember lists submissions for a member with pagination and optional filters
func (r *PRSubmissionRepository) ListByMember(memberID uint, page, pageSize int, statusID *int, q string) ([]entity.PRSubmission, int64, error) {
	var items []entity.PRSubmission
	var total int64

	db := r.DB.Model(&entity.PRSubmission{}).Where(&entity.PRSubmission{MemberID: memberID})
	if statusID != nil {
		db = db.Where(&entity.PRSubmission{StatusID: *statusID})
	}
	if q != "" {
		escaped := utils.EscapeLikePattern(q)
		like := "%" + strings.ToLower(escaped) + "%"
		db = db.Where("LOWER(pr_title) LIKE ? OR LOWER(pr_content) LIKE ?", like, like)
	}

	db.Count(&total)
	if page < 1 {
		page = 1
	}
	offset := (page - 1) * pageSize
	err := db.Preload("Media").Order("pr_id desc").Limit(pageSize).Offset(offset).Find(&items).Error
	return items, total, err
}

// ListAll lists all submissions (admin) with optional filters
func (r *PRSubmissionRepository) ListAll(page, pageSize int, memberID *uint, statusID *int, q string) ([]entity.PRSubmission, int64, error) {
	var items []entity.PRSubmission
	var total int64

	db := r.DB.Model(&entity.PRSubmission{})
	if memberID != nil {
		db = db.Where(&entity.PRSubmission{MemberID: *memberID})
	}
	if statusID != nil {
		db = db.Where(&entity.PRSubmission{StatusID: *statusID})
	}
	if q != "" {
		escaped := utils.EscapeLikePattern(q)
		like := "%" + strings.ToLower(escaped) + "%"
		db = db.Where("LOWER(pr_title) LIKE ? OR LOWER(pr_content) LIKE ?", like, like)
	}

	db.Count(&total)
	if page < 1 {
		page = 1
	}
	offset := (page - 1) * pageSize
	err := db.Preload("Media").Preload("Reviews").Preload("Member").Order("pr_id desc").Limit(pageSize).Offset(offset).Find(&items).Error
	return items, total, err
}

// Delete removes a PR submission and its related media and reviews
func (r *PRSubmissionRepository) Delete(id int) error {
	return r.DB.Transaction(func(tx *gorm.DB) error {
		// Remove media and reviews first
		if err := tx.Where(&entity.PRReview{PRID: id}).Delete(&entity.PRReview{}).Error; err != nil {
			return err
		}
		if err := tx.Where(&entity.PRSubmissionMedia{PRID: id}).Delete(&entity.PRSubmissionMedia{}).Error; err != nil {
			return err
		}
		// Remove related reports
		uid := uint(id)
		if err := tx.Where(&entity.Report{TargetType: "pr_submission", TargetID: &uid}).Delete(&entity.Report{}).Error; err != nil {
			return err
		}
		// Unlink announcements (set pr_id to null)
		prIdPtr := id
		if err := tx.Model(&entity.Announcement{}).Where(&entity.Announcement{PRSubmissionID: &prIdPtr}).Update("pr_id", nil).Error; err != nil {
			return err
		}
		if err := tx.Delete(&entity.PRSubmission{}, id).Error; err != nil {
			return err
		}
		return nil
	})
}
