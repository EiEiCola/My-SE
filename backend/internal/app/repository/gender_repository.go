package repository

import (
	
	"github.com/sut68/team12/backend/internal/entity"
	"gorm.io/gorm"
)

type GenderRepository interface {
	FindAll() ([]entity.Gender, error)
	FindByID(id uint) (*entity.Gender, error)
	ExistsByID(id uint) (bool, error)
}

type genderRepository struct {
	db *gorm.DB
}

func NewGenderRepository(db *gorm.DB) GenderRepository {
	return &genderRepository{db: db}
}

func (r *genderRepository) FindAll() ([]entity.Gender, error) {
	var genders []entity.Gender
	if err := r.db.Find(&genders).Error; err != nil {
		return nil, err
	}
	return genders, nil
}

func (r *genderRepository) FindByID(id uint) (*entity.Gender, error) {
	var gender entity.Gender
	if err := r.db.First(&gender, id).Error; err != nil {
		return nil, err
	}
	return &gender, nil
}

func (r *genderRepository) ExistsByID(id uint) (bool, error) {
	var count int64
	if err := r.db.
		Model(&entity.Gender{}).
		Where("id = ?", id).
		Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}
