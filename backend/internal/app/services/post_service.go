package services

import (
	"errors"
	"mime/multipart"
	"time"

	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/dto"
	"github.com/sut68/team12/backend/internal/entity"
	"gorm.io/gorm"
)

var (
	ErrPostNotFound = errors.New("post not found")
	ErrForbidden    = errors.New("forbidden")
)

type PostService struct {
	DB             *gorm.DB
	PostRepo       *repository.PostRepository
	ImageRepo      *repository.PostImageRepository
	AttachmentRepo *repository.PostAttachmentRepository
}

func NewPostService(
	db *gorm.DB,
	postRepo *repository.PostRepository,
	imgRepo *repository.PostImageRepository,
	attRepo *repository.PostAttachmentRepository,
) *PostService {
	return &PostService{
		DB:             db,
		PostRepo:       postRepo,
		ImageRepo:      imgRepo,
		AttachmentRepo: attRepo,
	}
}

// สร้างโพสต์ใหม่
func (s *PostService) CreatePost(
	userID uint,
	req dto.CreatePostRequest,
	imageFiles []*multipart.FileHeader,
	attachmentFiles []*multipart.FileHeader,
) (*entity.Post, error) {

	post := &entity.Post{
		AuthorID:        userID,
		Title:           req.Title,
		Content:         req.Content,
		IsAnonymous:     req.IsAnonymous,
		MainCategoryID:  req.MainCategoryID,
		SubCategoryL1ID: req.SubCategory1ID,
		SubCategoryL2ID: req.SubCategory2ID,
		Status:          "Active",
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}
	// ไม่ได้ใช้ transaction ลึกๆ เพื่อลดความซับซ้อน
	if err := s.PostRepo.Create(post); err != nil {
		return nil, err
	}

	// รูปภาพ
	for idx, f := range imageFiles {
		// ตรงนี้ต้องเปลี่ยนให้เป็น path จริง หลังจากอัพโหลดไฟล์เสร็จ
		url := f.Filename
		img := &entity.PostImage{
			PostID:     post.ID,
			URL:        url,
			OrderIndex: idx,
			CreatedAt:  time.Now(),
			UpdatedAt:  time.Now(),
		}
		if err := s.ImageRepo.Create(img); err != nil {
			return nil, err
		}
	}

	// ไฟล์แนบ
	for idx, f := range attachmentFiles {
		// ตรงนี้ต้องเปลี่ยนให้เป็น path จริง หลังจากอัพโหลดไฟล์เสร็จ
		url := f.Filename
		att := &entity.PostAttachment{
			PostID:     post.ID,
			FileURL:    url,
			FileName:   f.Filename,
			FileSize:   f.Size,
			OrderIndex: idx,
			CreatedAt:  time.Now(),
			UpdatedAt:  time.Now(),
		}
		if err := s.AttachmentRepo.Create(att); err != nil {
			return nil, err
		}

	}
	return post, nil
}

// ดึงโพสต์โดย ID (พร้อม preload images, attachments)
func (s *PostService) GetPostByID(id uint) (*entity.Post, error) {
	post, err := s.PostRepo.FindByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrPostNotFound
		}
		return nil, err
	}
	return post, nil
}

// อัปเดตโพสต์ (เฉพาะเจ้าของโพสต์เท่านั้น)
func (s *PostService) UpdatePost(
	userID uint,
	postID uint,
	req dto.UpdatePostRequest,
) (*entity.Post, error) {

	post, err := s.PostRepo.FindByID(postID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrPostNotFound
		}
		return nil, err
	}

	if post.AuthorID != userID {
		return nil, ErrForbidden
	}

	if req.Title != nil {
		post.Title = *req.Title
	}

	if req.Content != nil {
		post.Content = *req.Content
	}

	if req.IsAnonymous != nil {
		post.IsAnonymous = *req.IsAnonymous
	}

	if req.MainCategoryID != nil {
		post.MainCategoryID = req.MainCategoryID
	}

	if req.SubCategory1ID != nil {
		post.SubCategoryL1ID = req.SubCategory1ID
	}

	if req.SubCategory2ID != nil {
		post.SubCategoryL2ID = req.SubCategory2ID
	}

	post.UpdatedAt = time.Now()

	if err := s.PostRepo.Update(post); err != nil {
		return nil, err
	}
	return post, nil
}

// ลบโพสต์ (เฉพาะเจ้าของโพสต์เท่านั้น)
func (s *PostService) DeletePost(userID, postID uint) error {
	post, err := s.PostRepo.FindByID(postID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrPostNotFound
		}
		return err
	}

	if post.AuthorID != userID {
		return ErrForbidden
	}

	// ลบ image, attachment ที่เกี่ยวข้องก่อน (ถ้าต้องการ)
	if err := s.ImageRepo.DeleteByPostID(postID); err != nil {
		return err
	}

	if err := s.AttachmentRepo.DeleteByPostID(postID); err != nil {
		return err
	}

	return s.PostRepo.Delete(postID)
}
