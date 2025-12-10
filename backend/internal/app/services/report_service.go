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
}

func NewReportService(db *gorm.DB, repo *repository.ReportRepository) *ReportService {
	return &ReportService{DB: db, ReportRepo: repo}
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

func (s *ReportService) GetByID(id int) (*entity.Report, error) {
	return s.ReportRepo.GetByID(id)
}

func (s *ReportService) ListByReporter(reporterID uint, page, pageSize int, statusID *int, targetType string, q string) ([]entity.Report, int64, error) {
	return s.ReportRepo.ListByReporter(reporterID, page, pageSize, statusID, targetType, q)
}

func (s *ReportService) AdminListReports(page, pageSize int, statusID *int, targetType string, reporterID *uint, q string) ([]entity.Report, int64, error) {
	return s.ReportRepo.ListAll(page, pageSize, statusID, targetType, reporterID, q)
}

func (s *ReportService) UpdateStatus(reportID int, statusID int, adminID uint) error {
	return s.ReportRepo.UpdateStatus(reportID, statusID, adminID)
}
