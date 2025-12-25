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

func (s *AnnouncementService) ListAll(page, pageSize int, prID *int) ([]entity.Announcement, int64, error) {
	return s.AnnRepo.ListAll(page, pageSize, prID)
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

type CreateAnnouncementInput struct {
	Title          string     `json:"title" binding:"required"`
	Content        string     `json:"content" binding:"required"`
	PublishStartAt *time.Time `json:"publish_start_at"`
	PublishEndAt   *time.Time `json:"publish_end_at"`
	PinPriority    int        `json:"pin_priority"`
	Medias         []string   `json:"medias"` // Simplified for now, just URLs
}

func (s *AnnouncementService) CreateAnnouncement(adminID int, in *CreateAnnouncementInput) (*entity.Announcement, error) {
	uid := uint(adminID)
	ann := &entity.Announcement{
		AdminID:     &uid,
		Title:       in.Title,
		Content:     in.Content,
		StatusID:    1, // Active
		PinPriority: in.PinPriority,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	if in.PublishStartAt != nil {
		ann.PublishStartAt = *in.PublishStartAt
	}
	if in.PublishEndAt != nil {
		ann.PublishEndAt = *in.PublishEndAt
	}

	err := s.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(ann).Error; err != nil {
			return err
		}
		// Basic media handling - assuming images for now
		for _, url := range in.Medias {
			am := entity.AnnouncementMedia{
				AnnouncementID: ann.ID,
				URL:            url,
				// Type removed as it doesn't exist in entity
			}
			if err := tx.Create(&am).Error; err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return s.AnnRepo.GetByID(ann.ID)
}

func (s *AnnouncementService) GetByID(id int) (*entity.Announcement, error) {
	return s.AnnRepo.GetByID(id)
}

func (s *AnnouncementService) UpdateAnnouncement(id int, in *CreateAnnouncementInput) (*entity.Announcement, error) {
	ann, err := s.AnnRepo.GetByID(id)
	if err != nil {
		return nil, err
	}
	ann.Title = in.Title
	ann.Content = in.Content
	ann.PinPriority = in.PinPriority
	if in.PublishStartAt != nil {
		ann.PublishStartAt = *in.PublishStartAt
	}
	if in.PublishEndAt != nil {
		ann.PublishEndAt = *in.PublishEndAt
	}
	ann.UpdatedAt = time.Now()

	// Note: Media update logic is complex, skipping for simplicity unless requested.
	// Usually involves sync (add new, remove missing).

	if err := s.AnnRepo.Update(ann); err != nil {
		return nil, err
	}
	return ann, nil
}

func (s *AnnouncementService) DeleteAnnouncement(id int) error {
	return s.AnnRepo.Delete(id)
}

// GetPublishedByID retrieves an announcement only if it is published and active
func (s *AnnouncementService) GetPublishedByID(id int) (*entity.Announcement, error) {
	ann, err := s.AnnRepo.GetByID(id)
	if err != nil {
		return nil, err
	}
	// Check Status Active (1)
	if ann.StatusID != 1 {
		return nil, gorm.ErrRecordNotFound
	}
	// Check Date Range
	now := time.Now()
	if now.Before(ann.PublishStartAt) || now.After(ann.PublishEndAt) {
		return nil, gorm.ErrRecordNotFound
	}
	return ann, nil
}
