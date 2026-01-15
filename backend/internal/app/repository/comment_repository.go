package repository

import (
	"gorm.io/gorm"

	"github.com/sut68/team12/backend/internal/entity"
)

type CommentRepository struct {
	db *gorm.DB
}

func NewCommentRepository(db *gorm.DB) *CommentRepository {
	return &CommentRepository{db: db}
}

// FindByPostID returns all comments for a specific post
func (r *CommentRepository) FindByPostID(postID uint) ([]entity.Comment, error) {
	var comments []entity.Comment
	err := r.db.Where("post_id = ?", postID).
		Preload("Author").
		Preload("Images").
		Preload("Attachments").
		Order("created_at DESC").
		Find(&comments).Error
	return comments, err
}

// FindByID finds a comment by its ID
func (r *CommentRepository) FindByID(id uint) (*entity.Comment, error) {
	var comment entity.Comment
	err := r.db.First(&comment, id).Error
	if err != nil {
		return nil, err
	}
	return &comment, nil
}

// Create adds a new comment
func (r *CommentRepository) Create(comment *entity.Comment) error {
	return r.db.Create(comment).Error
}

// Delete removes a comment
func (r *CommentRepository) Delete(id uint) error {
	return r.db.Delete(&entity.Comment{}, id).Error
}

// CountByPost returns the number of comments for a post
func (r *CommentRepository) CountByPost(postID uint) (int64, error) {
	var count int64
	err := r.db.Model(&entity.Comment{}).Where("post_id = ?", postID).Count(&count).Error
	return count, err
}
