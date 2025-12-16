package services

import (
	"log"
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

		log.Println("Reviewing PR:", submissionID, "Status:", statusID)
		if err := tx.Model(&entity.PRSubmission{}).Where("pr_id = ?", submissionID).Update("StatusID", statusID).Error; err != nil {
			log.Println("Update Status Error:", err)
			return err
		}

		if createAnnouncement {
			log.Println("Creating Announcement for PR:", submissionID)
			uid := uint(adminID)
			ann := &entity.Announcement{
				AdminID:        &uid,
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
				log.Println("Create Announcement Error:", err)
				return err
			}
			log.Println("Announcement Created ID:", ann.ID)
			for _, m := range sub.Media {
				// ... media logic
				am := entity.AnnouncementMedia{
					AnnouncementID: ann.ID,
					URL:            m.URL,
					Image:          "",
					IsCover:        m.IsCover,
				}
				if err := tx.Create(&am).Error; err != nil {
					log.Println("Create Media Error:", err)
					return err
				}
				// If this is cover, update announcement's CoverMediaID
				if m.IsCover {
					mid := int(am.MediaID)
					// We need to use map to update to avoid zero value issues if using struct?
					// But we are in transaction.
					if err := tx.Model(&entity.Announcement{}).Where("ann_id = ?", ann.ID).Update("cover_media_id", mid).Error; err != nil {
						log.Println("Update Cover ID Error:", err)
					}
				}
			}
		}

		return nil
	})
}
