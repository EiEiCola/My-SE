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
	return r.DB.Delete(&entity.Announcement{}, id).Error
}

// ListPublished lists announcements that are within publish window (publish_StartAt/publish_EndAt)
func (r *AnnouncementRepository) ListPublished(page, pageSize int, now time.Time, start *time.Time, end *time.Time) ([]entity.Announcement, int64, error) {
	var items []entity.Announcement
	var total int64

	db := r.DB.Model(&entity.Announcement{}).Where("publish_StartAt <= ?", now).Where("publish_EndAt >= ?", now)
	if start != nil {
		db = db.Where("publish_StartAt >= ?", *start)
	}
	if end != nil {
		db = db.Where("publish_EndAt <= ?", *end)
	}

	db.Count(&total)
	if page < 1 {
		page = 1
	}
	offset := (page - 1) * pageSize
	err := db.Preload("Media").Order("publish_StartAt desc").Limit(pageSize).Offset(offset).Find(&items).Error
	return items, total, err
}
