package repository

import (
	"github.com/sut68/team12/backend/internal/entity"
	"gorm.io/gorm"
)

type PRReviewRepository struct {
	DB *gorm.DB
}

func NewPRReviewRepository(db *gorm.DB) *PRReviewRepository {
	return &PRReviewRepository{DB: db}
}

func (r *PRReviewRepository) Create(review *entity.PRReview) error {
	return r.DB.Create(review).Error
}
