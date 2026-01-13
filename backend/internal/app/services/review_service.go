package services

import (
	"errors"
	"regexp"
	"strconv"
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
	ListMyReviews(memberID uint, mainCategoryID *uint) ([]entity.Review, error)
	AddReviewImages(reviewID uint, memberID uint, images []dto.ReviewImageRequest) error
	VoteReview(reviewID uint, memberID uint, voteType string) (*dto.VoteReviewResponse, error)
}

type reviewService struct {
	reviewRepo repository.ReviewRepository
	pointSvc   PointService // ⭐ POINT SYSTEM: เพิ่มตัวแปร PointService
}

func NewReviewService(
	reviewRepo repository.ReviewRepository,
	pointSvc PointService, // ⭐ POINT SYSTEM: รับค่า PointService เข้ามา
) ReviewService {
	return &reviewService{
		reviewRepo: reviewRepo,
		pointSvc:   pointSvc,
	}
}



func (s *reviewService) CreateReview(req dto.CreateReviewRequest) (*entity.Review, error) {
	if req.MainCategoryID == nil || *req.MainCategoryID == 0 {
		return nil, errors.New("main_category_id is required")
	}

	if req.SubCategoryL2ID != nil && *req.SubCategoryL2ID != 0 {
		if req.SubCategoryL1ID == nil || *req.SubCategoryL1ID == 0 {
			return nil, errors.New("sub_category_l1_id is required when sub_category_l2_id is provided")
		}
	}

	review := &entity.Review{
		Title:           req.Title,
		Content:         req.Content,
		Rating:          req.Rating,
		IsAnonymous:     req.IsAnonymous,
		MemberID:        req.MemberID,
		MainCategoryID:  req.MainCategoryID,
		SubCategoryL1ID: req.SubCategoryL1ID,
		SubCategoryL2ID: req.SubCategoryL2ID,
		HelpfulCount:    0,
		NotHelpfulCount: 0,
	}

	// 1) สร้างรีวิว (ของเพื่อน)
	if err := s.reviewRepo.CreateReview(review); err != nil {
		return nil, err
	}

	// 2) ⭐ POINT SYSTEM: ให้แต้ม (15 แต้ม)
	if s.pointSvc != nil {
		idemKey := "REVIEW_CREATE:" +
			strconv.FormatUint(uint64(review.MemberID), 10) + ":" +
			strconv.FormatUint(uint64(review.ID), 10)

		_ = s.pointSvc.EarnPoints(review.MemberID, "REVIEW_CREATE", "REVIEW", review.ID, idemKey)
	}

	// 3) จัดการ Hashtags (ของเพื่อน)
	allTags := make([]string, 0, len(req.Hashtags)+8)
	allTags = append(allTags, req.Hashtags...)
	allTags = append(allTags, extractHashtags(req.Content)...)

	if len(allTags) > 0 {
		seen := make(map[string]struct{})
		for _, raw := range allTags {
			name := normalizeTag(raw)
			if name == "" { continue }
			if _, ok := seen[name]; ok { continue }
			seen[name] = struct{}{}

			tag, _ := s.reviewRepo.FindTagByName(name)
			if tag == nil {
				newTag := &entity.Tag{Name: name}
				if err := s.reviewRepo.CreateTag(newTag); err == nil {
					tag = newTag
				} else if isUniqueConstraintError(err) {
					tag, _ = s.reviewRepo.FindTagByName(name)
				}
			}
			if tag != nil {
				_ = s.reviewRepo.AttachTagToReview(review.ID, tag.ID)
			}
		}
	}

	
	full, err := s.reviewRepo.FindReviewByID(review.ID)
if err != nil {
    return nil, err
}
return full, nil
}



func (s *reviewService) AddReviewImages(reviewID uint, memberID uint, images []dto.ReviewImageRequest) error {
	if err := s.reviewRepo.CheckReviewOwner(reviewID, memberID); err != nil {
		// ✅ ใช้ gorm เช็คค่าตามเพื่อน (หายแดงแน่นอน)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return gorm.ErrRecordNotFound
		}
		return err
	}

	for i, img := range images {
		if strings.TrimSpace(img.URL) == "" { continue }
		sortOrder := img.SortOrder
		if sortOrder == 0 { sortOrder = i + 1 }
		row := &entity.ReviewImage{
			URL: img.URL, IsCover: img.IsCover, SortOrder: sortOrder, ReviewID: reviewID,
		}
		_ = s.reviewRepo.CreateReviewImage(row)
	}
	return nil
}

func (s *reviewService) VoteReview(reviewID uint, memberID uint, voteType string) (*dto.VoteReviewResponse, error) {
	if err := s.reviewRepo.CheckReviewOwner(reviewID, memberID); err == nil {
		return nil, errors.New("owner_cannot_vote")
	} else if !errors.Is(err, gorm.ErrRecordNotFound) { // ✅ ใช้ gorm เช็คค่าตามเพื่อน
		return nil, err
	}

	h, n, myVote, action, err := s.reviewRepo.ToggleReviewVote(reviewID, memberID, voteType)
	if err != nil { return nil, err }
	return &dto.VoteReviewResponse{
		ReviewID: reviewID, HelpfulCount: h, NotHelpfulCount: n, MyVoteType: myVote, Action: action,
	}, nil
}

func (s *reviewService) ListReviews(mainCategoryID *uint) ([]entity.Review, error) {
	return s.reviewRepo.ListReviewsByCategory(mainCategoryID)
}

func (s *reviewService) ListMyReviews(memberID uint, mainCategoryID *uint) ([]entity.Review, error) {
	return s.reviewRepo.ListMyReviews(memberID, mainCategoryID)
}

func (s *reviewService) DeleteReview(reviewID uint, memberID uint) error {
	return s.reviewRepo.DeleteReviewByID(reviewID, memberID)
}

/* ================= Helpers (คงเดิม) ================= */

var hashtagRe = regexp.MustCompile(`#([\p{L}\p{M}\p{N}_-]+)`)

func extractHashtags(text string) []string {
	matches := hashtagRe.FindAllStringSubmatch(text, -1)
	out := make([]string, 0, len(matches))
	seen := map[string]struct{}{}
	for _, m := range matches {
		if len(m) < 2 { continue }
		tag := strings.TrimSpace(m[1])
		if tag == "" { continue }
		if _, ok := seen[tag]; ok { continue }
		seen[tag] = struct{}{}
		out = append(out, tag)
	}
	return out
}

func normalizeTag(raw string) string {
	s := strings.TrimSpace(raw)
	s = strings.TrimLeft(s, "#")
	return strings.ToLower(strings.TrimSpace(s))
}

func isUniqueConstraintError(err error) bool {
	if err == nil { return false }
	msg := strings.ToLower(err.Error())
	return strings.Contains(msg, "duplicate") || strings.Contains(msg, "unique")
}