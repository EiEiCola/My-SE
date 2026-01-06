package repository

import (
	"time"

	"github.com/sut68/team12/backend/internal/entity"
	"gorm.io/gorm"
)

type AnnouncementRepository struct {
	DB *gorm.DB
}

func NewAnnouncementRepository(db *gorm.DB) *AnnouncementRepository {
	return &AnnouncementRepository{DB: db}
}

func (r *AnnouncementRepository) Create(a *entity.Announcement) error {
	return r.DB.Create(a).Error
}

func (r *AnnouncementRepository) GetByID(id int) (*entity.Announcement, error) {
	var ann entity.Announcement
	err := r.DB.Preload("Media").First(&ann, id).Error
	if err != nil {
		return nil, err
	}
	return &ann, nil
}

func (r *AnnouncementRepository) Update(a *entity.Announcement) error {
	return r.DB.Save(a).Error
}

func (r *AnnouncementRepository) Delete(id int) error {
	return r.DB.Transaction(func(tx *gorm.DB) error {
		// Remove media rows first to avoid FK/constraint issues
		if err := tx.Where(&entity.AnnouncementMedia{AnnouncementID: id}).Delete(&entity.AnnouncementMedia{}).Error; err != nil {
			return err
		}
		// Also remove read status to avoid FK issues
		if err := tx.Where(&entity.AnnouncementRead{AnnouncementID: id}).Delete(&entity.AnnouncementRead{}).Error; err != nil {
			return err
		}
		if err := tx.Delete(&entity.Announcement{}, id).Error; err != nil {
			return err
		}
		return nil
	})
}

// ListPublished lists announcements that are within publish window (publish_start_at/publish_end_at)
func (r *AnnouncementRepository) ListPublished(page, pageSize int, now time.Time, start *time.Time, end *time.Time) ([]entity.Announcement, int64, error) {
	var items []entity.Announcement
	var total int64

	db := r.DB.Model(&entity.Announcement{}).Where("publish_start_at <= ?", now).Where("publish_end_at >= ?", now)
	if start != nil {
		db = db.Where("publish_start_at >= ?", *start)
	}
	if end != nil {
		db = db.Where("publish_end_at <= ?", *end)
	}

	db.Count(&total)
	if page < 1 {
		page = 1
	}
	offset := (page - 1) * pageSize
	err := db.Preload("Media").Order("publish_start_at desc").Limit(pageSize).Offset(offset).Find(&items).Error
	return items, total, err
}

// ListAll lists all announcements without date filtering (for admin)
func (r *AnnouncementRepository) ListAll(page, pageSize int, prID *int) ([]entity.Announcement, int64, error) {
	var items []entity.Announcement
	var total int64

	db := r.DB.Model(&entity.Announcement{})
	if prID != nil {
		db = db.Where(&entity.Announcement{PRSubmissionID: prID})
	}
	db.Count(&total)
	if page < 1 {
		page = 1
	}
	offset := (page - 1) * pageSize
	err := db.Preload("Media").Order("ann_id desc").Limit(pageSize).Offset(offset).Find(&items).Error
	return items, total, err
}
