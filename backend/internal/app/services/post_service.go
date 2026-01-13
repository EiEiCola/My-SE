package services

import (
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
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
	LikeRepo       *repository.PostLikeRepository
	CommentRepo    *repository.CommentRepository
	BookmarkRepo   *repository.BookmarkRepository
	// --- Added by Point System ---
	PointService PointService
}

func NewPostService(
	db *gorm.DB,
	postRepo *repository.PostRepository,
	imgRepo *repository.PostImageRepository,
	attRepo *repository.PostAttachmentRepository,
	likeRepo *repository.PostLikeRepository,
	commentRepo *repository.CommentRepository,
	bookmarkRepo *repository.BookmarkRepository,
	// --- Added by Point System ---
	pointService PointService,
) *PostService {
	return &PostService{
		DB:             db,
		PostRepo:       postRepo,
		ImageRepo:      imgRepo,
		AttachmentRepo: attRepo,
		LikeRepo:       likeRepo,
		CommentRepo:    commentRepo,
		BookmarkRepo:   bookmarkRepo,
		// --- Added by Point System ---
		PointService: pointService,
	}
}

// สร้างโพสต์ใหม่
func (s *PostService) CreatePost(
	userID uint,
	req dto.CreatePostRequest,
	imageFiles []*multipart.FileHeader,
	attachmentFiles []*multipart.FileHeader,
) (*entity.Post, error) {

	// File validation constants
	const maxImageSize = 5 * 1024 * 1024       // 5 MB
	const maxAttachmentSize = 20 * 1024 * 1024 // 20 MB
	const maxImages = 10
	const maxAttachments = 3

	// Validate image count
	if len(imageFiles) > maxImages {
		return nil, fmt.Errorf("จำนวนรูปภาพต้องไม่เกิน %d รูป", maxImages)
	}

	// Validate attachment count
	if len(attachmentFiles) > maxAttachments {
		return nil, fmt.Errorf("จำนวนไฟล์แนบต้องไม่เกิน %d ไฟล์", maxAttachments)
	}

	// Validate image files
	allowedImageTypes := map[string]bool{
		".jpg": true, ".jpeg": true, ".png": true, ".webp": true,
	}
	for _, f := range imageFiles {
		if f.Size > maxImageSize {
			return nil, fmt.Errorf("รูปภาพ %s มีขนาดเกิน 5 MB", f.Filename)
		}
		ext := strings.ToLower(filepath.Ext(f.Filename))
		if !allowedImageTypes[ext] {
			return nil, fmt.Errorf("รูปภาพ %s ไม่ใช่ไฟล์ที่รองรับ (JPG, PNG, WEBP)", f.Filename)
		}
	}

	// Validate attachment files
	allowedAttachmentTypes := map[string]bool{
		".pdf": true, ".docx": true, ".xlsx": true, ".zip": true,
	}
	for _, f := range attachmentFiles {
		if f.Size > maxAttachmentSize {
			return nil, fmt.Errorf("ไฟล์ %s มีขนาดเกิน 20 MB", f.Filename)
		}
		ext := strings.ToLower(filepath.Ext(f.Filename))
		if !allowedAttachmentTypes[ext] {
			return nil, fmt.Errorf("ไฟล์ %s ไม่ใช่ไฟล์ที่รองรับ (PDF, DOCX, XLSX, ZIP)", f.Filename)
		}
	}

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

	// Create upload directories if not exist
	imageDir := fmt.Sprintf("uploads/posts/%d/images", post.ID)
	attachmentDir := fmt.Sprintf("uploads/posts/%d/attachments", post.ID)
	os.MkdirAll(imageDir, 0755)
	os.MkdirAll(attachmentDir, 0755)

	// รูปภาพ
	for idx, f := range imageFiles {
		ext := strings.ToLower(filepath.Ext(f.Filename))
		newFilename := fmt.Sprintf("%s%s", uuid.New().String(), ext)
		filePath := filepath.Join(imageDir, newFilename)

		if err := saveUploadedFile(f, filePath); err != nil {
			return nil, fmt.Errorf("ไม่สามารถบันทึกรูปภาพ %s: %v", f.Filename, err)
		}

		img := &entity.PostImage{
			PostID:     post.ID,
			URL:        "/" + filePath,
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
		ext := strings.ToLower(filepath.Ext(f.Filename))
		newFilename := fmt.Sprintf("%s%s", uuid.New().String(), ext)
		filePath := filepath.Join(attachmentDir, newFilename)

		if err := saveUploadedFile(f, filePath); err != nil {
			return nil, fmt.Errorf("ไม่สามารถบันทึกไฟล์ %s: %v", f.Filename, err)
		}

		att := &entity.PostAttachment{
			PostID:     post.ID,
			FileURL:    "/" + filePath,
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

	// --- Added by Point System ---
	// มอบแต้มให้ผู้ใช้หลังจากสร้างโพสต์สำเร็จ
	// ใช้ activityType "Post Create" ตามข้อมูลใน Database ของคุณ
	_ = s.PointService.EarnPoints(userID, "Post Create", "posts", post.ID, "")

	return post, nil
}

// Helper function to save uploaded file
func saveUploadedFile(file *multipart.FileHeader, dst string) error {
	src, err := file.Open()
	if err != nil {
		return err
	}
	defer src.Close()

	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, src)
	return err
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

// ดึงโพสต์ทั้งหมด
func (s *PostService) GetAllPosts() ([]entity.Post, error) {
	return s.PostRepo.FindAll()
}

// อัปเดตโพสต์ (เฉพาะเจ้าของโพสต์เท่านั้น)
func (s *PostService) UpdatePost(
	userID uint,
	postID uint,
	req dto.UpdatePostRequest,
	imageFiles []*multipart.FileHeader,
	attachmentFiles []*multipart.FileHeader,
	deletedImageIDs []uint,
	deletedAttachmentIDs []uint,
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

	// Delete specified images
	for _, imgID := range deletedImageIDs {
		img := &entity.PostImage{}
		if err := s.DB.First(img, imgID).Error; err == nil && img.PostID == postID {
			filePath := strings.TrimPrefix(img.URL, "/")
			os.Remove(filePath)
			s.DB.Delete(img)
		}
	}

	// Delete specified attachments
	for _, attID := range deletedAttachmentIDs {
		att := &entity.PostAttachment{}
		if err := s.DB.First(att, attID).Error; err == nil && att.PostID == postID {
			filePath := strings.TrimPrefix(att.FileURL, "/")
			os.Remove(filePath)
			s.DB.Delete(att)
		}
	}

	// Add new images
	if len(imageFiles) > 0 {
		imageDir := fmt.Sprintf("uploads/posts/%d/images", post.ID)
		os.MkdirAll(imageDir, 0755)

		var maxOrder int
		s.DB.Model(&entity.PostImage{}).Where("post_id = ?", post.ID).Select("COALESCE(MAX(order_index), -1)").Scan(&maxOrder)

		for idx, f := range imageFiles {
			ext := strings.ToLower(filepath.Ext(f.Filename))
			newFilename := fmt.Sprintf("%s%s", uuid.New().String(), ext)
			filePath := filepath.Join(imageDir, newFilename)

			if err := saveUploadedFile(f, filePath); err != nil {
				return nil, fmt.Errorf("ไม่สามารถบันทึกรูปภาพ %s: %v", f.Filename, err)
			}

			img := &entity.PostImage{
				PostID:     post.ID,
				URL:        "/" + filePath,
				OrderIndex: maxOrder + 1 + idx,
				CreatedAt:  time.Now(),
				UpdatedAt:  time.Now(),
			}
			if err := s.ImageRepo.Create(img); err != nil {
				return nil, err
			}
		}
	}

	// Add new attachments
	if len(attachmentFiles) > 0 {
		attachmentDir := fmt.Sprintf("uploads/posts/%d/attachments", post.ID)
		os.MkdirAll(attachmentDir, 0755)

		var maxOrder int
		s.DB.Model(&entity.PostAttachment{}).Where("post_id = ?", post.ID).Select("COALESCE(MAX(order_index), -1)").Scan(&maxOrder)

		for idx, f := range attachmentFiles {
			ext := strings.ToLower(filepath.Ext(f.Filename))
			newFilename := fmt.Sprintf("%s%s", uuid.New().String(), ext)
			filePath := filepath.Join(attachmentDir, newFilename)

			if err := saveUploadedFile(f, filePath); err != nil {
				return nil, fmt.Errorf("ไม่สามารถบันทึกไฟล์ %s: %v", f.Filename, err)
			}

			att := &entity.PostAttachment{
				PostID:     post.ID,
				FileURL:    "/" + filePath,
				FileName:   f.Filename,
				FileSize:   f.Size,
				OrderIndex: maxOrder + 1 + idx,
				CreatedAt:  time.Now(),
				UpdatedAt:  time.Now(),
			}
			if err := s.AttachmentRepo.Create(att); err != nil {
				return nil, err
			}
		}
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

	if err := s.ImageRepo.DeleteByPostID(postID); err != nil {
		return err
	}

	if err := s.AttachmentRepo.DeleteByPostID(postID); err != nil {
		return err
	}

	return s.PostRepo.Delete(postID)
}

// ลบโพสต์โดย Admin (ไม่ต้องเช็ค ownership)
func (s *PostService) AdminDeletePost(postID uint) error {
	post, err := s.PostRepo.FindByID(postID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrPostNotFound
		}
		return err
	}

	if err := s.ImageRepo.DeleteByPostID(post.ID); err != nil {
		return err
	}

	if err := s.AttachmentRepo.DeleteByPostID(post.ID); err != nil {
		return err
	}

	return s.PostRepo.Delete(postID)
}

// =============== LIKE METHODS ===============

func (s *PostService) ToggleLike(postID, userID uint) (int64, bool, error) {
	post, err := s.PostRepo.FindByID(postID)
	if err != nil {
		return 0, false, ErrPostNotFound
	}

	isLiked := s.LikeRepo.HasUserLiked(postID, userID)

	if isLiked {
		if err := s.LikeRepo.Delete(postID, userID); err != nil {
			return 0, false, err
		}
		if post.LikeCount > 0 {
			s.DB.Model(post).Update("like_count", post.LikeCount-1)
		}
	} else {
		like := &entity.PostLike{
			PostID: postID,
			UserID: userID,
		}
		if err := s.LikeRepo.Create(like); err != nil {
			return 0, false, err
		}
		s.DB.Model(post).Update("like_count", post.LikeCount+1)
	}

	count, _ := s.LikeRepo.CountByPost(postID)
	return count, !isLiked, nil
}

func (s *PostService) HasUserLiked(postID, userID uint) bool {
	return s.LikeRepo.HasUserLiked(postID, userID)
}

// =============== COMMENT METHODS ===============

func (s *PostService) GetComments(postID uint) ([]entity.Comment, error) {
	return s.CommentRepo.FindByPostID(postID)
}

func (s *PostService) CreateComment(postID, userID uint, content string, isAnonymous bool) (*entity.Comment, error) {
	post, err := s.PostRepo.FindByID(postID)
	if err != nil {
		return nil, ErrPostNotFound
	}

	comment := &entity.Comment{
		PostID:      postID,
		AuthorID:    userID,
		Content:     content,
		IsAnonymous: isAnonymous,
		Status:      "active",
	}

	if err := s.CommentRepo.Create(comment); err != nil {
		return nil, err
	}

	s.DB.Model(post).Update("comment_count", post.CommentCount+1)

	return comment, nil
}

func (s *PostService) DeleteComment(commentID, userID uint) error {
	comment, err := s.CommentRepo.FindByID(commentID)
	if err != nil {
		return errors.New("comment not found")
	}

	if comment.AuthorID != userID {
		return ErrForbidden
	}

	post, err := s.PostRepo.FindByID(comment.PostID)
	if err == nil && post.CommentCount > 0 {
		s.DB.Model(post).Update("comment_count", post.CommentCount-1)
	}

	return s.CommentRepo.Delete(commentID)
}

// =============== BOOKMARK METHODS ===============

func (s *PostService) ToggleBookmark(postID, userID uint) (bool, error) {
	post, err := s.PostRepo.FindByID(postID)
	if err != nil {
		return false, ErrPostNotFound
	}

	if post.AuthorID == userID {
		return false, errors.New("cannot bookmark your own post")
	}

	isBookmarked := s.BookmarkRepo.IsBookmarked(userID, postID)

	if isBookmarked {
		if err := s.BookmarkRepo.Delete(userID, postID); err != nil {
			return false, err
		}
		return false, nil
	} else {
		bookmark := &entity.Bookmark{
			PostID:   postID,
			MemberID: userID,
		}
		if err := s.BookmarkRepo.Create(bookmark); err != nil {
			return false, err
		}
		return true, nil
	}
}

func (s *PostService) IsBookmarked(postID, userID uint) bool {
	return s.BookmarkRepo.IsBookmarked(userID, postID)
}

func (s *PostService) GetBookmarkedPosts(memberID uint) ([]entity.Post, error) {
	return s.BookmarkRepo.GetBookmarkedPosts(memberID)
}

func (s *PostService) GetMyPosts(memberID uint) ([]entity.Post, error) {
	return s.PostRepo.FindByAuthorID(memberID)
}