package repository

import (
	
    "github.com/sut68/team12/backend/internal/entity"
    "gorm.io/gorm"
)

type ActiveStatusRepository interface {
    // FindAll ดึง ActiveStatus ทั้งหมดจากฐานข้อมูล
    FindAll() ([]entity.ActiveStatus, error)

    // FindByID ดึง ActiveStatus ตาม primary key (ID)
    FindByID(id uint) (*entity.ActiveStatus, error)
}

type activeStatusRepository struct {
    db *gorm.DB
}

func NewActiveStatusRepository(db *gorm.DB) ActiveStatusRepository {
    return &activeStatusRepository{db: db}
}

// FindAll
// ดึง ActiveStatus ทุกแถวจากฐานข้อมูล
func (r *activeStatusRepository) FindAll() ([]entity.ActiveStatus, error) {
    var statuses []entity.ActiveStatus
    if err := r.db.Find(&statuses).Error; err != nil {
        return nil, err
    }
    return statuses, nil
}

// FindByID
// ดึง ActiveStatus จาก ID เดียว
func (r *activeStatusRepository) FindByID(id uint) (*entity.ActiveStatus, error) {
    var status entity.ActiveStatus
    if err := r.db.First(&status, id).Error; err != nil {
        return nil, err
    }
    return &status, nil
}
