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
}

func NewPostService(
	db *gorm.DB,
	postRepo *repository.PostRepository,
	imgRepo *repository.PostImageRepository,
	attRepo *repository.PostAttachmentRepository,
	likeRepo *repository.PostLikeRepository,
	commentRepo *repository.CommentRepository,
	bookmarkRepo *repository.BookmarkRepository,
) *PostService {
	return &PostService{
		DB:             db,
		PostRepo:       postRepo,
		ImageRepo:      imgRepo,
		AttachmentRepo: attRepo,
		LikeRepo:       likeRepo,
		CommentRepo:    commentRepo,
		BookmarkRepo:   bookmarkRepo,
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
		// Generate unique filename
		ext := strings.ToLower(filepath.Ext(f.Filename))
		newFilename := fmt.Sprintf("%s%s", uuid.New().String(), ext)
		filePath := filepath.Join(imageDir, newFilename)

		// Save file
		if err := saveUploadedFile(f, filePath); err != nil {
			return nil, fmt.Errorf("ไม่สามารถบันทึกรูปภาพ %s: %v", f.Filename, err)
		}

		img := &entity.PostImage{
			PostID:     post.ID,
			URL:        "/" + filePath, // URL path for serving
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
		// Generate unique filename but keep original extension
		ext := strings.ToLower(filepath.Ext(f.Filename))
		newFilename := fmt.Sprintf("%s%s", uuid.New().String(), ext)
		filePath := filepath.Join(attachmentDir, newFilename)

		// Save file
		if err := saveUploadedFile(f, filePath); err != nil {
			return nil, fmt.Errorf("ไม่สามารถบันทึกไฟล์ %s: %v", f.Filename, err)
		}

		att := &entity.PostAttachment{
			PostID:     post.ID,
			FileURL:    "/" + filePath,
			FileName:   f.Filename, // Keep original filename for display
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
		// Delete file from disk
		img := &entity.PostImage{}
		if err := s.DB.First(img, imgID).Error; err == nil && img.PostID == postID {
			// Remove file from disk
			filePath := strings.TrimPrefix(img.URL, "/")
			os.Remove(filePath)
			// Delete from DB
			s.DB.Delete(img)
		}
	}

	// Delete specified attachments
	for _, attID := range deletedAttachmentIDs {
		att := &entity.PostAttachment{}
		if err := s.DB.First(att, attID).Error; err == nil && att.PostID == postID {
			// Remove file from disk
			filePath := strings.TrimPrefix(att.FileURL, "/")
			os.Remove(filePath)
			// Delete from DB
			s.DB.Delete(att)
		}
	}

	// Add new images
	if len(imageFiles) > 0 {
		imageDir := fmt.Sprintf("uploads/posts/%d/images", post.ID)
		os.MkdirAll(imageDir, 0755)

		// Get current max order index
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

		// Get current max order index
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

	// ลบ image, attachment ที่เกี่ยวข้องก่อน (ถ้าต้องการ)
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

	// ลบ image, attachment ที่เกี่ยวข้อง
	if err := s.ImageRepo.DeleteByPostID(post.ID); err != nil {
		return err
	}

	if err := s.AttachmentRepo.DeleteByPostID(post.ID); err != nil {
		return err
	}

	return s.PostRepo.Delete(postID)
}

// =============== LIKE METHODS ===============

// ToggleLike toggles a like for a post - returns new like count and whether user now likes the post
func (s *PostService) ToggleLike(postID, userID uint) (int64, bool, error) {
	// Check if post exists
	post, err := s.PostRepo.FindByID(postID)
	if err != nil {
		return 0, false, ErrPostNotFound
	}

	// Check if user already liked
	isLiked := s.LikeRepo.HasUserLiked(postID, userID)

	if isLiked {
		// Unlike - delete the like
		if err := s.LikeRepo.Delete(postID, userID); err != nil {
			return 0, false, err
		}
		// Update post like count
		if post.LikeCount > 0 {
			s.DB.Model(post).Update("like_count", post.LikeCount-1)
		}
	} else {
		// Like - create new like
		like := &entity.PostLike{
			PostID: postID,
			UserID: userID,
		}
		if err := s.LikeRepo.Create(like); err != nil {
			return 0, false, err
		}
		// Update post like count
		s.DB.Model(post).Update("like_count", post.LikeCount+1)
	}

	// Get updated count
	count, _ := s.LikeRepo.CountByPost(postID)
	return count, !isLiked, nil
}

// HasUserLiked checks if user has liked a post
func (s *PostService) HasUserLiked(postID, userID uint) bool {
	return s.LikeRepo.HasUserLiked(postID, userID)
}

// =============== COMMENT METHODS ===============

// GetComments returns all comments for a post
func (s *PostService) GetComments(postID uint) ([]entity.Comment, error) {
	return s.CommentRepo.FindByPostID(postID)
}

// CreateComment creates a new comment on a post
func (s *PostService) CreateComment(postID, userID uint, content string, isAnonymous bool) (*entity.Comment, error) {
	// Check if post exists
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

	// Update post comment count
	s.DB.Model(post).Update("comment_count", post.CommentCount+1)

	return comment, nil
}

// DeleteComment deletes a comment (only by owner or admin)
func (s *PostService) DeleteComment(commentID, userID uint) error {
	comment, err := s.CommentRepo.FindByID(commentID)
	if err != nil {
		return errors.New("comment not found")
	}

	// Check ownership
	if comment.AuthorID != userID {
		return ErrForbidden
	}

	// Update post comment count
	post, err := s.PostRepo.FindByID(comment.PostID)
	if err == nil && post.CommentCount > 0 {
		s.DB.Model(post).Update("comment_count", post.CommentCount-1)
	}

	return s.CommentRepo.Delete(commentID)
}

// =============== BOOKMARK METHODS ===============

// ToggleBookmark toggles a bookmark for a post
func (s *PostService) ToggleBookmark(postID, userID uint) (bool, error) {
	// Check if post exists
	post, err := s.PostRepo.FindByID(postID)
	if err != nil {
		return false, ErrPostNotFound
	}

	// Prevent bookmarking own post
	if post.AuthorID == userID {
		return false, errors.New("cannot bookmark your own post")
	}

	// Check if user already bookmarked
	isBookmarked := s.BookmarkRepo.IsBookmarked(userID, postID)

	if isBookmarked {
		// Remove bookmark
		if err := s.BookmarkRepo.Delete(userID, postID); err != nil {
			return false, err
		}
		return false, nil
	} else {
		// Add bookmark
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

// IsBookmarked checks if user has bookmarked a post
func (s *PostService) IsBookmarked(postID, userID uint) bool {
	return s.BookmarkRepo.IsBookmarked(userID, postID)
}

// GetBookmarkedPosts returns all posts bookmarked by user
func (s *PostService) GetBookmarkedPosts(memberID uint) ([]entity.Post, error) {
	return s.BookmarkRepo.GetBookmarkedPosts(memberID)
}

// GetMyPosts returns all posts created by user
func (s *PostService) GetMyPosts(memberID uint) ([]entity.Post, error) {
	return s.PostRepo.FindByAuthorID(memberID)
}
