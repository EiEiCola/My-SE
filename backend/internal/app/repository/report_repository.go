package repository

import (
	"strings"

	"github.com/sut68/team12/backend/internal/entity"
	"gorm.io/gorm"
)

type ReportRepository struct {
	DB *gorm.DB
}

func NewReportRepository(db *gorm.DB) *ReportRepository {
	return &ReportRepository{DB: db}
}

func (r *ReportRepository) Create(report *entity.Report, media []entity.ReportMedia) error {
	return r.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(report).Error; err != nil {
			return err
		}
		if len(media) == 0 {
			return nil
		}
		for i := range media {
			media[i].ReportID = report.ID
		}
		if err := tx.Create(&media).Error; err != nil {
			return err
		}
		return nil
	})
}

func (r *ReportRepository) GetByID(id int) (*entity.Report, error) {
	var rep entity.Report
	if err := r.DB.Preload("Media").Preload("Reporter").Preload("Status").Preload("Admin").Where("report_ID = ?", id).First(&rep).Error; err != nil {
		return nil, err
	}
	return &rep, nil
}

func (r *ReportRepository) ListByReporter(reporterID uint, page, pageSize int, statusID *int, targetType string, q string) ([]entity.Report, int64, error) {
	var items []entity.Report
	var total int64

	db := r.DB.Model(&entity.Report{}).Where("reporter_ID = ?", reporterID)
	if statusID != nil {
		db = db.Where("status = ?", *statusID)
	}
	if targetType != "" {
		db = db.Where("target_type = ?", targetType)
	}
	if q != "" {
		like := "%" + strings.ToLower(q) + "%"
		db = db.Where("LOWER(title) LIKE ? OR LOWER(description) LIKE ?", like, like)
	}

	db.Count(&total)
	if page < 1 {
		page = 1
	}
	offset := (page - 1) * pageSize
	err := db.Preload("Media").Order("report_ID desc").Limit(pageSize).Offset(offset).Find(&items).Error
	return items, total, err
}

func (r *ReportRepository) ListAll(page, pageSize int, statusID *int, targetType string, reporterID *uint, q string) ([]entity.Report, int64, error) {
	var items []entity.Report
	var total int64

	db := r.DB.Model(&entity.Report{})
	if statusID != nil {
		db = db.Where("status = ?", *statusID)
	}
	if targetType != "" {
		db = db.Where("target_type = ?", targetType)
	}
	if reporterID != nil {
		db = db.Where("reporter_ID = ?", *reporterID)
	}
	if q != "" {
		like := "%" + strings.ToLower(q) + "%"
		db = db.Where("LOWER(title) LIKE ? OR LOWER(description) LIKE ?", like, like)
	}

	db.Count(&total)
	if page < 1 {
		page = 1
	}
	offset := (page - 1) * pageSize
	err := db.Preload("Media").Preload("Reporter").Preload("Status").Preload("Admin").Order("report_ID desc").Limit(pageSize).Offset(offset).Find(&items).Error
	return items, total, err
}

func (r *ReportRepository) UpdateStatus(reportID int, statusID int, adminID uint) error {
	return r.DB.Model(&entity.Report{}).Where("report_ID = ?", reportID).Updates(map[string]interface{}{
		"status":   statusID,
		"admin_ID": adminID,
	}).Error
}
