package repository

import (
	"gorm.io/gorm"

	"github.com/sut68/team12/backend/internal/entity"
)

type PostLikeRepository struct {
	db *gorm.DB
}

func NewPostLikeRepository(db *gorm.DB) *PostLikeRepository {
	return &PostLikeRepository{db: db}
}

// FindByPostAndUser checks if a user has liked a specific post
func (r *PostLikeRepository) FindByPostAndUser(postID, userID uint) (*entity.PostLike, error) {
	var like entity.PostLike
	err := r.db.Where("post_id = ? AND user_id = ?", postID, userID).First(&like).Error
	if err != nil {
		return nil, err
	}
	return &like, nil
}

// Create adds a new like
func (r *PostLikeRepository) Create(like *entity.PostLike) error {
	return r.db.Create(like).Error
}

// Delete removes a like
func (r *PostLikeRepository) Delete(postID, userID uint) error {
	return r.db.Where("post_id = ? AND user_id = ?", postID, userID).Delete(&entity.PostLike{}).Error
}

// CountByPost returns the number of likes for a post
func (r *PostLikeRepository) CountByPost(postID uint) (int64, error) {
	var count int64
	err := r.db.Model(&entity.PostLike{}).Where("post_id = ?", postID).Count(&count).Error
	return count, err
}

// HasUserLiked checks if user has liked a post (returns bool)
func (r *PostLikeRepository) HasUserLiked(postID, userID uint) bool {
	var count int64
	r.db.Model(&entity.PostLike{}).Where("post_id = ? AND user_id = ?", postID, userID).Count(&count)
	return count > 0
}
