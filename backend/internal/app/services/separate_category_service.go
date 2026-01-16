package services

import (
	"github.com/sut68/team12/backend/internal/entity"
	"gorm.io/gorm"
)

type AnnouncementCategoryService struct {
	DB *gorm.DB
}

func NewAnnouncementCategoryService(db *gorm.DB) *AnnouncementCategoryService {
	return &AnnouncementCategoryService{DB: db}
}

func (s *AnnouncementCategoryService) FindAll() ([]entity.AnnouncementCategory, error) {
	var items []entity.AnnouncementCategory
	err := s.DB.Order("display_order ASC").Find(&items).Error
	return items, err
}

type ReportReasonService struct {
	DB *gorm.DB
}

func NewReportReasonService(db *gorm.DB) *ReportReasonService {
	return &ReportReasonService{DB: db}
}

func (s *ReportReasonService) FindAll() ([]entity.ReportReason, error) {
	var items []entity.ReportReason
	err := s.DB.Order("display_order ASC").Find(&items).Error
	return items, err
}
