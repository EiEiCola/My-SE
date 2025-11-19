package services

import (
	"time"

	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/entity"
	"gorm.io/gorm"
)

type AnnouncementService struct {
	DB      *gorm.DB
	AnnRepo *repository.AnnouncementRepository
}

func NewAnnouncementService(db *gorm.DB, annRepo *repository.AnnouncementRepository) *AnnouncementService {
	return &AnnouncementService{DB: db, AnnRepo: annRepo}
}

func (s *AnnouncementService) ListAnnouncements(page, pageSize int, now time.Time, start *time.Time, end *time.Time) ([]entity.Announcement, int64, error) {
	return s.AnnRepo.ListPublished(page, pageSize, now, start, end)
}

// CreateFromSubmission creates an Announcement and associated media from a PRSubmission using the provided tx
func (s *AnnouncementService) CreateFromSubmission(tx *gorm.DB, submission *entity.PRSubmission, createdByAdmin int) (*entity.Announcement, error) {
	ann := &entity.Announcement{
		PRSubmissionID: &submission.ID,
		Title:          submission.Title,
		Content:        submission.Content,
		PublishStartAt: submission.ReqStartAt,
		PublishEndAt:   submission.ReqEndAt,
		StatusID:       1,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}
	if err := tx.Create(ann).Error; err != nil {
		return nil, err
	}
	for _, m := range submission.Media {
		am := entity.AnnouncementMedia{
			AnnouncementID: ann.ID,
			URL:            m.URL,
			Image:          "",
			IsCover:        m.IsCover,
		}
		if err := tx.Create(&am).Error; err != nil {
			return nil, err
		}
	}
	return ann, nil
}
