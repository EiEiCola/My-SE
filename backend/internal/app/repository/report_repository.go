package repository

import (
	"strings"

	"github.com/sut68/team12/backend/internal/entity"
	"github.com/sut68/team12/backend/internal/utils"
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
	if err := r.DB.Preload("Media").Preload("Reporter").Preload("Status").Preload("Admin").First(&rep, id).Error; err != nil {
		return nil, err
	}
	return &rep, nil
}

func (r *ReportRepository) ListByReporter(reporterID uint, page, pageSize int, statusID *int, targetType string, q string) ([]entity.Report, int64, error) {
	var items []entity.Report
	var total int64

	// Use quoted identifiers to match existing Postgres columns created with mixed-case tags
	db := r.DB.Model(&entity.Report{}).Where(&entity.Report{ReporterID: reporterID})
	if statusID != nil {
		db = db.Where("status = ?", *statusID)
	}
	if targetType != "" {
		db = db.Where("LOWER(target_type) = LOWER(?)", targetType)
	}
	if q != "" {
		escaped := utils.EscapeLikePattern(q)
		like := "%" + strings.ToLower(escaped) + "%"
		db = db.Where("LOWER(title) LIKE ? OR LOWER(description) LIKE ?", like, like)
	}

	db.Count(&total)
	if page < 1 {
		page = 1
	}
	offset := (page - 1) * pageSize
	err := db.Preload("Media").Order("\"report_ID\" desc").Limit(pageSize).Offset(offset).Find(&items).Error
	return items, total, err
}

func (r *ReportRepository) ListAll(page, pageSize int, statusID *int, targetType string, reporterID *uint, q string) ([]entity.Report, int64, error) {
	var items []entity.Report
	var total int64

	db := r.DB.Model(&entity.Report{})
	queryObj := entity.Report{}
	if statusID != nil {
		queryObj.StatusID = *statusID
	}
	if reporterID != nil {
		queryObj.ReporterID = *reporterID
	}
	db = r.DB.Model(&entity.Report{}).Where(&queryObj)
	if targetType != "" {
		db = db.Where("LOWER(target_type) = LOWER(?)", targetType)
	}
	if q != "" {
		escaped := utils.EscapeLikePattern(q)
		like := "%" + strings.ToLower(escaped) + "%"
		db = db.Where("LOWER(title) LIKE ? OR LOWER(description) LIKE ?", like, like)
	}

	db.Count(&total)
	if page < 1 {
		page = 1
	}
	offset := (page - 1) * pageSize
	err := db.Preload("Media").Preload("Reporter").Preload("Status").Preload("Admin").Order("\"report_ID\" desc").Limit(pageSize).Offset(offset).Find(&items).Error
	return items, total, err
}

func (r *ReportRepository) UpdateStatus(reportID int, statusID int, adminID uint) error {
	return r.DB.Model(&entity.Report{}).Where(&entity.Report{ID: reportID}).Updates(map[string]interface{}{
		"status":   statusID,
		"admin_ID": adminID,
	}).Error
}

func (r *ReportRepository) Update(report *entity.Report, media []entity.ReportMedia) error {
	return r.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(report).Error; err != nil {
			return err
		}
		// Replace media - match mixed-case column name
		if err := tx.Where(&entity.ReportMedia{ReportID: report.ID}).Delete(&entity.ReportMedia{}).Error; err != nil {
			return err
		}
		if len(media) > 0 {
			for i := range media {
				media[i].ReportID = report.ID
			}
			if err := tx.Create(&media).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *ReportRepository) Delete(id int) error {
	return r.DB.Transaction(func(tx *gorm.DB) error {
		// Remove media first
		if err := tx.Where(&entity.ReportMedia{ReportID: id}).Delete(&entity.ReportMedia{}).Error; err != nil {
			return err
		}
		if err := tx.Delete(&entity.Report{}, id).Error; err != nil {
			return err
		}
		return nil
	})
}

func (r *ReportRepository) CountReportsByTarget(targetType string, targetIDs []uint) (map[uint]int64, error) {
	out := make(map[uint]int64)
	if len(targetIDs) == 0 {
		return out, nil
	}

	type result struct {
		TargetID uint
		Count    int64
	}

	var results []result
	err := r.DB.Model(&entity.Report{}).
		Select("target_id, count(*) as count").
		Where("target_type = ? AND target_id IN ?", targetType, targetIDs).
		Group("target_id").
		Scan(&results).Error

	if err != nil {
		return nil, err
	}

	for _, res := range results {
		out[res.TargetID] = res.Count
	}

	return out, nil
}
