package repository

import (
	"github.com/sut68/team12/backend/internal/entity"
	"gorm.io/gorm"
)

type BookmarkRepository struct {
	db *gorm.DB
}

func NewBookmarkRepository(db *gorm.DB) *BookmarkRepository {
	return &BookmarkRepository{db: db}
}

func (r *BookmarkRepository) Create(bookmark *entity.Bookmark) error {
	return r.db.Create(bookmark).Error
}

func (r *BookmarkRepository) Delete(memberID, postID uint) error {
	return r.db.Where("member_id = ? AND post_id = ?", memberID, postID).Delete(&entity.Bookmark{}).Error
}

func (r *BookmarkRepository) IsBookmarked(memberID, postID uint) bool {
	var count int64
	r.db.Model(&entity.Bookmark{}).
		Where("member_id = ? AND post_id = ?", memberID, postID).
		Count(&count)
	return count > 0
}

// GetBookmarkedPosts fetches all posts bookmarked by a user
func (r *BookmarkRepository) GetBookmarkedPosts(memberID uint) ([]entity.Post, error) {
	var bookmarks []entity.Bookmark
	if err := r.db.Where("member_id = ?", memberID).Find(&bookmarks).Error; err != nil {
		return nil, err
	}

	if len(bookmarks) == 0 {
		return []entity.Post{}, nil
	}

	var postIDs []uint
	for _, b := range bookmarks {
		postIDs = append(postIDs, b.PostID)
	}

	var posts []entity.Post
	err := r.db.
		Preload("Images").
		Preload("Attachments").
		Preload("MainCategory").
		Preload("SubCategoryL1").
		Preload("SubCategoryL2").
		Preload("Author").
		Where("id IN ?", postIDs).
		Order("created_at DESC").
		Find(&posts).Error

	return posts, err
}
