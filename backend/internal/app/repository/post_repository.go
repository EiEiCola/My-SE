package repository

import (
	"github.com/sut68/team12/backend/internal/entity"
	"gorm.io/gorm"
)

// ---- Post ----

type PostRepository struct {
	DB *gorm.DB
}

func NewPostRepository(db *gorm.DB) *PostRepository {
	return &PostRepository{DB: db}
}

func (r *PostRepository) Create(p *entity.Post) error {
	return r.DB.Create(p).Error
}

func (r *PostRepository) Update(p *entity.Post) error {
	return r.DB.Save(p).Error
}

func (r *PostRepository) Delete(id uint) error {
	// Hard Delete: ลบออกจาก Database จริงๆ
	return r.DB.Unscoped().Delete(&entity.Post{}, id).Error
}

func (r *PostRepository) FindByID(id uint) (*entity.Post, error) {
	var post entity.Post
	err := r.DB.
		Preload("Images").
		Preload("Attachments").
		Preload("Comments").
		Preload("MainCategory").
		Preload("SubCategoryL1").
		Preload("SubCategoryL2").
		Preload("Author").
		First(&post, id).Error
	if err != nil {
		return nil, err
	}
	return &post, nil
}

// ดึงโพสต์ทั้งหมดของ user คนหนึ่ง
func (r *PostRepository) FindByAuthorID(authorID uint) ([]entity.Post, error) {
	var posts []entity.Post
	err := r.DB.
		Preload("Images").
		Preload("Attachments").
		Preload("MainCategory").
		Preload("SubCategoryL1").
		Preload("SubCategoryL2").
		Preload("Author"). // ✅ Ensure Author (Member) is loaded
		Where("author_id = ?", authorID).
		Order("created_at DESC").
		Find(&posts).Error
	return posts, err
}

// ดึงโพสต์ทั้งหมด (สำหรับ admin - รวม deleted)
func (r *PostRepository) FindAll() ([]entity.Post, error) {
	var posts []entity.Post
	err := r.DB.
		Preload("Images").
		Preload("Attachments").
		Preload("Reports").
		Preload("MainCategory").
		Preload("SubCategoryL1").
		Preload("SubCategoryL2").
		Preload("Author"). // ✅ Ensure Author (Member) is loaded
		Order("created_at DESC").
		Find(&posts).Error
	return posts, err
}

// ดึงโพสต์ที่ Active เท่านั้น (สำหรับ Public/Member)
func (r *PostRepository) FindAllActive() ([]entity.Post, error) {
	var posts []entity.Post
	err := r.DB.
		Preload("Images").
		Preload("Attachments").
		Preload("Reports").
		Preload("MainCategory").
		Preload("SubCategoryL1").
		Preload("SubCategoryL2").
		Preload("Author").
		Where("status != ?", "deleted"). // ✅ กรอง deleted ออก
		Order("created_at DESC").
		Find(&posts).Error
	return posts, err
}

// ดึงโพสต์ที่ Active แบบ Pagination
func (r *PostRepository) FindActivePaginated(page, limit int) ([]entity.Post, int64, error) {
	var posts []entity.Post
	var total int64

	offset := (page - 1) * limit

	query := r.DB.Model(&entity.Post{}).Where("status != ?", "deleted")

	query.Count(&total)

	err := query.
		Preload("Images").
		Preload("Attachments").
		Preload("Reports").
		Preload("MainCategory").
		Preload("SubCategoryL1").
		Preload("SubCategoryL2").
		Preload("Author").
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&posts).Error

	return posts, total, err
}

// ---- PostImage ----
type PostImageRepository struct {
	DB *gorm.DB
}

func NewPostImageRepository(db *gorm.DB) *PostImageRepository {
	return &PostImageRepository{DB: db}
}

func (r *PostImageRepository) Create(img *entity.PostImage) error {
	return r.DB.Create(img).Error
}

func (r *PostImageRepository) DeleteByPostID(postID uint) error {
	return r.DB.Where("post_id = ?", postID).Delete(&entity.PostImage{}).Error
}

// ---- PostAttachment ----
type PostAttachmentRepository struct {
	DB *gorm.DB
}

func NewPostAttachmentRepository(db *gorm.DB) *PostAttachmentRepository {
	return &PostAttachmentRepository{DB: db}
}

func (r *PostAttachmentRepository) Create(att *entity.PostAttachment) error {
	return r.DB.Create(att).Error
}

func (r *PostAttachmentRepository) DeleteByPostID(postID uint) error {
	return r.DB.Where("post_id = ?", postID).Delete(&entity.PostAttachment{}).Error
}
