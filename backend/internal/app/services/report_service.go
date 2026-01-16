package services

import (
	"time"

	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/entity"
	"gorm.io/gorm"
)

type ReportService struct {
	DB         *gorm.DB
	ReportRepo *repository.ReportRepository
	PostRepo   *repository.PostRepository
}

func NewReportService(db *gorm.DB, repo *repository.ReportRepository, postRepo *repository.PostRepository) *ReportService {
	return &ReportService{DB: db, ReportRepo: repo, PostRepo: postRepo}
}

type ReportMediaInput struct {
	URL          string `json:"url" binding:"required"`
	Type         string `json:"type"`
	IsAttachment bool   `json:"is_attachment"`
}

type CreateReportInput struct {
	TargetType  string             `json:"target_type" binding:"required"`
	TargetID    *uint              `json:"target_id"`
	Title       string             `json:"title" binding:"required"`
	Description string             `json:"description" binding:"required"`
	Medias      []ReportMediaInput `json:"medias"`
}

func (s *ReportService) CreateReport(reporterID uint, in *CreateReportInput) (*entity.Report, error) {
	rep := &entity.Report{
		ReporterID:  reporterID,
		TargetType:  in.TargetType,
		TargetID:    in.TargetID,
		Title:       in.Title,
		Description: in.Description,
		StatusID:    1,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	var media []entity.ReportMedia
	for _, m := range in.Medias {
		media = append(media, entity.ReportMedia{
			URL:          m.URL,
			Type:         m.Type,
			IsAttachment: m.IsAttachment,
		})
	}

	if err := s.ReportRepo.Create(rep, media); err != nil {
		return nil, err
	}
	return s.ReportRepo.GetByID(rep.ID)
}

// ReportPost creates a report specifically for a post
// Validates that:
// 1. The post exists
// 2. The reporter is not the post author (cannot report own posts)
func (s *ReportService) ReportPost(postID uint, reporterID uint, title, description string, medias []ReportMediaInput) (*entity.Report, error) {
	// 1. Check if post exists
	post, err := s.PostRepo.FindByID(postID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, &CustomError{Message: "โพสต์ไม่พบ"}
		}
		return nil, err
	}

	// 2. Check if user is trying to report their own post
	if post.AuthorID == reporterID {
		return nil, &CustomError{Message: "ไม่สามารถรายงานโพสต์ของตัวเองได้"}
	}

	// 3. Create report
	targetID := postID
	in := &CreateReportInput{
		TargetType:  "Post",
		TargetID:    &targetID,
		Title:       title,
		Description: description,
		Medias:      medias,
	}

	return s.CreateReport(reporterID, in)
}

func (s *ReportService) GetByID(id int) (*entity.Report, error) {
	return s.ReportRepo.GetByID(id)
}

func (s *ReportService) ListByReporter(reporterID uint, page, pageSize int, statusID *int, targetType string, q string) ([]entity.Report, int64, error) {
	return s.ReportRepo.ListByReporter(reporterID, page, pageSize, statusID, targetType, q)
}

func (s *ReportService) AdminListReports(page, pageSize int, statusID *int, targetType string, targetID *uint, reporterID *uint, q string) ([]entity.Report, int64, error) {
	return s.ReportRepo.ListAll(page, pageSize, statusID, targetType, targetID, reporterID, q)
}

func (s *ReportService) UpdateStatus(reportID int, statusID int, adminID uint) error {
	return s.ReportRepo.UpdateStatus(reportID, statusID, adminID)
}

func (s *ReportService) UpdateReport(id int, memberID uint, in *CreateReportInput) (*entity.Report, error) {
	// Check exists
	curr, err := s.ReportRepo.GetByID(id)
	if err != nil {
		return nil, err
	}
	// Check owner
	if curr.ReporterID != memberID {
		return nil, gorm.ErrRecordNotFound // Or forbidden
	}
	// Check status (only pending can be edited)
	if curr.StatusID != 1 {
		return nil, &CustomError{Message: "cannot edit processed report"}
	}

	curr.TargetType = in.TargetType
	curr.Title = in.Title
	curr.Description = in.Description
	curr.UpdatedAt = time.Now()

	var media []entity.ReportMedia
	for _, m := range in.Medias {
		media = append(media, entity.ReportMedia{
			URL:          m.URL,
			Type:         m.Type,
			IsAttachment: m.IsAttachment,
		})
	}

	if err := s.ReportRepo.Update(curr, media); err != nil {
		return nil, err
	}
	return s.ReportRepo.GetByID(curr.ID)
}

func (s *ReportService) DeleteReport(id int, memberID uint) error {
	curr, err := s.ReportRepo.GetByID(id)
	if err != nil {
		return err
	}
	if curr.ReporterID != memberID {
		return gorm.ErrRecordNotFound
	}
	// Check status
	if curr.StatusID != 1 {
		return &CustomError{Message: "cannot delete processed report"}
	}
	return s.ReportRepo.Delete(id)
}

type CustomError struct {
	Message string
}

func (e *CustomError) Error() string {
	return e.Message
}
