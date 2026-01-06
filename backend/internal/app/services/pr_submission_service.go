package services

import (
	"errors"
	"time"

	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/entity"
	"gorm.io/gorm"
)

type PRSubmissionService struct {
	DB     *gorm.DB
	PRRepo *repository.PRSubmissionRepository
}

func NewPRSubmissionService(db *gorm.DB, prRepo *repository.PRSubmissionRepository) *PRSubmissionService {
	return &PRSubmissionService{DB: db, PRRepo: prRepo}
}

type PRMediaInput struct {
	URL     string `json:"url" binding:"required"`
	Type    string `json:"type"`
	IsCover bool   `json:"is_cover"`
}

type CreatePRSubmissionInput struct {
	Title      string         `json:"title" binding:"required"`
	Content    string         `json:"content" binding:"required"`
	ReqStartAt *time.Time     `json:"req_start_at"`
	ReqEndAt   *time.Time     `json:"req_end_at"`
	Medias     []PRMediaInput `json:"medias"`
}

func (s *PRSubmissionService) CreateSubmission(memberID uint, in *CreatePRSubmissionInput) (*entity.PRSubmission, error) {
	sub := &entity.PRSubmission{
		MemberID: memberID,
		Title:    in.Title,
		Content:  in.Content,
		StatusID: 1, // Default Pending
	}
	if in.ReqStartAt != nil {
		sub.ReqStartAt = *in.ReqStartAt
	}
	if in.ReqEndAt != nil {
		sub.ReqEndAt = *in.ReqEndAt
	}

	// Validate date range
	if in.ReqStartAt != nil && in.ReqEndAt != nil {
		if in.ReqEndAt.Before(*in.ReqStartAt) {
			return nil, errors.New("req_end_at must be after req_start_at")
		}
	}

	err := s.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(sub).Error; err != nil {
			return err
		}
		for _, m := range in.Medias {
			media := entity.PRSubmissionMedia{
				PRID:    sub.ID,
				URL:     m.URL,
				Type:    m.Type,
				IsCover: m.IsCover,
			}
			if err := tx.Create(&media).Error; err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return s.PRRepo.GetByID(sub.ID)
}

func (s *PRSubmissionService) UpdateSubmission(id int, title, content string, start, end *time.Time) error {
	sub, err := s.PRRepo.GetByID(id)
	if err != nil {
		return err
	}
	sub.Title = title
	sub.Content = content
	if start != nil {
		sub.ReqStartAt = *start
	}
	if end != nil {
		sub.ReqEndAt = *end
	}
	return s.PRRepo.Update(sub)
}

func (s *PRSubmissionService) GetByID(id int) (*entity.PRSubmission, error) {
	return s.PRRepo.GetByID(id)
}

func (s *PRSubmissionService) ListMemberSubmissions(memberID uint, page, pageSize int, statusID *int, q string) ([]entity.PRSubmission, int64, error) {
	return s.PRRepo.ListByMember(memberID, page, pageSize, statusID, q)
}

func (s *PRSubmissionService) AdminListSubmissions(page, pageSize int, memberID *uint, statusID *int, q string) ([]entity.PRSubmission, int64, error) {
	return s.PRRepo.ListAll(page, pageSize, memberID, statusID, q)
}

func (s *PRSubmissionService) DeleteSubmission(id int) error {
	return s.PRRepo.Delete(id)
}
