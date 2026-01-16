package repository

import (
	"github.com/sut68/team12/backend/internal/entity"
	"gorm.io/gorm"
)

type NotificationRepository struct {
	DB *gorm.DB
}

func NewNotificationRepository(db *gorm.DB) *NotificationRepository {
	return &NotificationRepository{DB: db}
}

func (r *NotificationRepository) Create(notification *entity.Notification) error {
	return r.DB.Create(notification).Error
}

func (r *NotificationRepository) GetByUserID(userID uint) ([]entity.Notification, error) {
	var notifications []entity.Notification
	err := r.DB.Where("user_id = ?", userID).Order("created_at desc").Find(&notifications).Error
	return notifications, err
}

func (r *NotificationRepository) MarkAsRead(id uint) error {
	return r.DB.Model(&entity.Notification{}).Where("id = ?", id).Update("is_read", true).Error
}

// MarkAllAsRead - อ่านทั้งหมดของ user
func (r *NotificationRepository) MarkAllAsRead(userID uint) error {
	return r.DB.Model(&entity.Notification{}).Where("user_id = ? AND is_read = ?", userID, false).Update("is_read", true).Error
}

// DeleteRead - ลบ notifications ที่อ่านแล้วของ user
func (r *NotificationRepository) DeleteRead(userID uint) error {
	return r.DB.Where("user_id = ? AND is_read = ?", userID, true).Delete(&entity.Notification{}).Error
}
