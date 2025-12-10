package services

import (
	// แก้ path ให้ตรงกับ module ของโปรเจกต์หนู
	"github.com/sut68/team12/backend/internal/dto"
	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/entity"
)

// Interface ที่ Controller จะเรียกใช้
type ReviewService interface {
	CreateReview(req dto.CreateReviewRequest) (*entity.Review, error)
	// เดี๋ยวอนาคตค่อยเพิ่ม Get/List/Vote อื่น ๆ ตามมา
}

// struct จริงที่ implement interface ด้านบน
type reviewService struct {
	reviewRepo repository.ReviewRepository
}

// ใช้ตอนประกาศใน router/controller
func NewReviewService(reviewRepo repository.ReviewRepository) ReviewService {
	return &reviewService{
		reviewRepo: reviewRepo,
	}
}

// ------------------------------
// สร้างรีวิวใหม่ (basic version)
// ------------------------------
func (s *reviewService) CreateReview(req dto.CreateReviewRequest) (*entity.Review, error) {
	// map จาก DTO → Entity Review
	review := &entity.Review{
		Title:       req.Title,
		Content:     req.Content,
		Rating:      req.Rating,
		IsAnonymous: req.IsAnonymous,

		MemberID:       req.MemberID,
		MainCategoryID: req.MainCategoryID,
		SubCategoryL1ID: req.SubCategoryL1ID,
		SubCategoryL2ID: req.SubCategoryL2ID,

		// เริ่มต้น count เป็น 0
		HelpfulCount:    0,
		NotHelpfulCount: 0,
	}

	// เซฟรีวิวลง DB ผ่าน repository
	if err := s.reviewRepo.CreateReview(review); err != nil {
		return nil, err
	}

	// ตอนนี้ยังไม่จัดการ hashtags / images
	// เดี๋ยวเพิ่มรอบหน้าได้ (ใช้ review.ID ต่อ)

	return review, nil
}
