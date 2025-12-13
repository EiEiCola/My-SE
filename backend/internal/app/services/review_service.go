package services

import (
	"errors"
	"strings"

	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/dto"
	"github.com/sut68/team12/backend/internal/entity"
)

// Interface ที่ Controller จะเรียกใช้
type ReviewService interface {
	CreateReview(req dto.CreateReviewRequest) (*entity.Review, error)
	ListReviews(mainCategoryID *uint) ([]entity.Review, error)
}

// struct จริงที่ implement interface
type reviewService struct {
	reviewRepo repository.ReviewRepository
}

// constructor
func NewReviewService(reviewRepo repository.ReviewRepository) ReviewService {
	return &reviewService{
		reviewRepo: reviewRepo,
	}
}

// ------------------------------
// สร้างรีวิวใหม่ (basic version)
// ------------------------------
func (s *reviewService) CreateReview(req dto.CreateReviewRequest) (*entity.Review, error) {
	// กันพลาด: main_category_id ต้องมี (ถึงแม้ binding:"required" จะเช็คให้แล้ว)
	if req.MainCategoryID == nil {
		return nil, errors.New("main_category_id is required")
	}

	// map จาก DTO → Entity Review
	// (entity ของหนูใช้ *uint สำหรับ categoryID อยู่แล้ว → ใส่ pointer ได้ตรง ๆ)
	review := &entity.Review{
		Title:       req.Title,
		Content:     req.Content,
		Rating:      req.Rating,
		IsAnonymous: req.IsAnonymous,

		MemberID: req.MemberID,

		MainCategoryID:  req.MainCategoryID,
		SubCategoryL1ID: req.SubCategoryL1ID,
		SubCategoryL2ID: req.SubCategoryL2ID,

		HelpfulCount:    0,
		NotHelpfulCount: 0,
	}

	// 1) เซฟรีวิวก่อน เพื่อให้ได้ review.ID
	if err := s.reviewRepo.CreateReview(review); err != nil {
		return nil, err
	}

	// 2) (optional) จัดการ hashtags ถ้ามีส่งมา
	// NOTE: ตอนนี้เรายังไม่ parse แบบ #xxx อัตโนมัติ แค่รับเป็น array มาแล้วผูกให้
	if len(req.Hashtags) > 0 {
		for _, raw := range req.Hashtags {
			name := strings.TrimSpace(raw)
			if name == "" {
				continue
			}
			// กันคนส่ง "#tag"
			name = strings.TrimPrefix(name, "#")
			name = strings.TrimSpace(name)
			if name == "" {
				continue
			}

			// หา tag เดิม
			tag, err := s.reviewRepo.FindTagByName(name)
			if err != nil {
				return nil, err
			}

			// ถ้าไม่เจอ → สร้างใหม่
			if tag == nil {
				newTag := &entity.Tag{Name: name}
				if err := s.reviewRepo.CreateTag(newTag); err != nil {
					return nil, err
				}
				// ผูก tag กับ review
				if err := s.reviewRepo.AttachTagToReview(review.ID, newTag.ID); err != nil {
					return nil, err
				}
			} else {
				// เจอแล้ว → ผูกเลย
				if err := s.reviewRepo.AttachTagToReview(review.ID, tag.ID); err != nil {
					return nil, err
				}
			}
		}
	}

	// 3) Images (ยังไม่ทำ เพราะต้องดูโครง ReviewImageRequest ของ DTO ก่อน)
	// TODO: loop req.Images แล้วสร้าง entity.ReviewImage (URL, is_cover, sort_order, review_id)

	return review, nil
}

// ------------------------------
// List reviews (optional filter category)
// ------------------------------
func (s *reviewService) ListReviews(mainCategoryID *uint) ([]entity.Review, error) {
	return s.reviewRepo.ListReviewsByCategory(mainCategoryID)
}
