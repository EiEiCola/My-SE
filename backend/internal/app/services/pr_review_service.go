package services

import (
	"time"

	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/entity"
	"gorm.io/gorm"
)

type PRReviewService struct {
	DB         *gorm.DB
	PRRepo     *repository.PRSubmissionRepository
	ReviewRepo *repository.PRReviewRepository
	AnnRepo    *repository.AnnouncementRepository
}

func NewPRReviewService(db *gorm.DB, prRepo *repository.PRSubmissionRepository, revRepo *repository.PRReviewRepository, annRepo *repository.AnnouncementRepository) *PRReviewService {
	return &PRReviewService{DB: db, PRRepo: prRepo, ReviewRepo: revRepo, AnnRepo: annRepo}
}

// ReviewSubmission handles creating a review, updating submission status, and optionally creating an announcement.
func (s *PRReviewService) ReviewSubmission(adminID int, submissionID int, statusID int, comment string, createAnnouncement bool) error {
	return s.DB.Transaction(func(tx *gorm.DB) error {
		sub, err := s.PRRepo.GetByID(submissionID)
		if err != nil {
			return err
		}

		review := &entity.PRReview{
			PRID:      submissionID,
			AdminID:   adminID,
			Comment:   comment,
			CreatedAt: time.Now(),
		}
		if err := tx.Create(review).Error; err != nil {
			return err
		}

		if err := tx.Model(&entity.PRSubmission{}).Where("pr_ID = ?", submissionID).Update("Status", statusID).Error; err != nil {
			return err
		}

		if createAnnouncement {
			ann := &entity.Announcement{
				PRSubmissionID: &sub.ID,
				Title:          sub.Title,
				Content:        sub.Content,
				PublishStartAt: sub.ReqStartAt,
				PublishEndAt:   sub.ReqEndAt,
				StatusID:       1,
				CreatedAt:      time.Now(),
				UpdatedAt:      time.Now(),
			}
			if err := tx.Create(ann).Error; err != nil {
				return err
			}
			for _, m := range sub.Media {
				am := entity.AnnouncementMedia{
					AnnouncementID: ann.ID,
					URL:            m.URL,
					Image:          "",
					IsCover:        m.IsCover,
				}
				if err := tx.Create(&am).Error; err != nil {
					return err
				}
			}
		}

		return nil
	})
}
