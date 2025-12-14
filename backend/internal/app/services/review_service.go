package services

import (
	"errors"
	"strings"

	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/dto"
	"github.com/sut68/team12/backend/internal/entity"
	"gorm.io/gorm"
)

type ReviewService interface {
	CreateReview(req dto.CreateReviewRequest) (*entity.Review, error)
	ListReviews(mainCategoryID *uint) ([]entity.Review, error)
	DeleteReview(reviewID uint, memberID uint) error

	// ✅ upload images metadata to DB
	AddReviewImages(reviewID uint, memberID uint, images []dto.ReviewImageRequest) error
}

type reviewService struct {
	reviewRepo repository.ReviewRepository
}

func NewReviewService(reviewRepo repository.ReviewRepository) ReviewService {
	return &reviewService{reviewRepo: reviewRepo}
}

func (s *reviewService) CreateReview(req dto.CreateReviewRequest) (*entity.Review, error) {
	if req.MainCategoryID == nil {
		return nil, errors.New("main_category_id is required")
	}

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

	// 1) create review ก่อน เพื่อให้ได้ review.ID
	if err := s.reviewRepo.CreateReview(review); err != nil {
		return nil, err
	}

	// 2) hashtags
	if len(req.Hashtags) > 0 {
		for _, raw := range req.Hashtags {
			name := strings.TrimSpace(strings.TrimPrefix(raw, "#"))
			if name == "" {
				continue
			}

			tag, err := s.reviewRepo.FindTagByName(name)
			if err != nil {
				return nil, err
			}

			if tag == nil {
				newTag := &entity.Tag{Name: name}
				if err := s.reviewRepo.CreateTag(newTag); err != nil {
					return nil, err
				}
				if err := s.reviewRepo.AttachTagToReview(review.ID, newTag.ID); err != nil {
					return nil, err
				}
			} else {
				if err := s.reviewRepo.AttachTagToReview(review.ID, tag.ID); err != nil {
					return nil, err
				}
			}
		}
	}

	// ❗images จะมาใน endpoint upload แยก

	// ✅ (ข้อ 2) โหลดใหม่พร้อม preload ก่อนส่งกลับ
	// เพื่อให้ Member/MainCategory/Tags/ReviewImages ไม่เป็น object ว่างๆ
	full, err := s.reviewRepo.FindReviewByID(review.ID)
	if err != nil {
		return nil, err
	}

	return full, nil
}

func (s *reviewService) AddReviewImages(reviewID uint, memberID uint, images []dto.ReviewImageRequest) error {
	// ต้องเป็นเจ้าของรีวิว
	if err := s.reviewRepo.CheckReviewOwner(reviewID, memberID); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return gorm.ErrRecordNotFound
		}
		return err
	}

	for i, img := range images {
		if strings.TrimSpace(img.URL) == "" {
			continue
		}

		sortOrder := img.SortOrder
		if sortOrder == 0 {
			sortOrder = i + 1
		}

		row := &entity.ReviewImage{
			URL:       img.URL,
			IsCover:   img.IsCover,
			SortOrder: sortOrder,
			ReviewID:  reviewID,
		}
		if err := s.reviewRepo.CreateReviewImage(row); err != nil {
			return err
		}
	}

	return nil
}

func (s *reviewService) ListReviews(mainCategoryID *uint) ([]entity.Review, error) {
	return s.reviewRepo.ListReviewsByCategory(mainCategoryID)
}

func (s *reviewService) DeleteReview(reviewID uint, memberID uint) error {
	return s.reviewRepo.DeleteReviewByID(reviewID, memberID)
}
