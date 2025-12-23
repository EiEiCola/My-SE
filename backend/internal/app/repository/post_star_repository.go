package repository

import (
	"github.com/sut68/team12/backend/internal/entity"
	"gorm.io/gorm"
)

type PostStarRepository interface {
	Create(star *entity.PostStar) error
	HasStarred(memberID, postID uint) (bool, error)
}

type postStarRepository struct {
	db *gorm.DB
}

func NewPostStarRepository(db *gorm.DB) PostStarRepository {
	return &postStarRepository{db: db}
}

func (r *postStarRepository) Create(star *entity.PostStar) error {
	return r.db.Create(star).Error
}

func (r *postStarRepository) HasStarred(memberID, postID uint) (bool, error) {
	var count int64
	err := r.db.Model(&entity.PostStar{}).
		Where("member_id = ? AND post_id = ?", memberID, postID).
		Count(&count).Error
	return count > 0, err
}
