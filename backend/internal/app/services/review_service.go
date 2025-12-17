package services

import (
	"errors"
	"regexp"
	"strings"

	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/dto"
	"github.com/sut68/team12/backend/internal/entity"
	"gorm.io/gorm"
)

// ✅ เพิ่ม: ValidationError (เอาไว้ให้ Controller map เป็น 400)
type ValidationError struct{ Msg string }

func (e ValidationError) Error() string { return e.Msg }

type ReviewService interface {
	CreateReview(req dto.CreateReviewRequest) (*entity.Review, error)
	ListReviews(mainCategoryID *uint) ([]entity.Review, error)
	DeleteReview(reviewID uint, memberID uint) error

	// ✅ upload images metadata to DB
	AddReviewImages(reviewID uint, memberID uint, images []dto.ReviewImageRequest) error

	// Vote
	VoteReview(reviewID uint, memberID uint, voteType string) (*dto.VoteReviewResponse, error)
}

type reviewService struct {
	reviewRepo repository.ReviewRepository
}

func NewReviewService(reviewRepo repository.ReviewRepository) ReviewService {
	return &reviewService{reviewRepo: reviewRepo}
}

// --------------------------
// helpers (อยู่ไฟล์นี้ได้เลย)
// --------------------------

// รองรับ hashtag ทุกภาษา + ตัวเลข + _ + -
// เช่น #เงินดี #SUT2025 #work-hard #หอA1
var hashtagRe = regexp.MustCompile(`#([\p{L}\p{N}_-]+)`)

func extractHashtags(text string) []string {
	matches := hashtagRe.FindAllStringSubmatch(text, -1)
	out := make([]string, 0, len(matches))

	seen := map[string]struct{}{}
	for _, m := range matches {
		if len(m) < 2 {
			continue
		}
		tag := strings.TrimSpace(m[1])
		if tag == "" {
			continue
		}
		if _, ok := seen[tag]; ok {
			continue
		}
		seen[tag] = struct{}{}
		out = append(out, tag)
	}
	return out
}

func normalizeTag(raw string) string {
	s := strings.TrimSpace(raw)
	// รองรับ "###tag" ให้เหลือแค่ tag
	s = strings.TrimLeft(s, "#")
	s = strings.TrimSpace(s)

	// กัน #Work กับ #work (ถ้าไม่อยาก lower ให้ลบบรรทัดนี้)
	s = strings.ToLower(s)

	return s
}

// ตรวจแบบ generic (รองรับ postgres/sqlite/mySQL จากข้อความ error)
func isUniqueConstraintError(err error) bool {
	if err == nil {
		return false
	}
	msg := strings.ToLower(err.Error())

	// Postgres: duplicate key value violates unique constraint
	if strings.Contains(msg, "duplicate key value") && strings.Contains(msg, "unique") {
		return true
	}
	// SQLite: UNIQUE constraint failed
	if strings.Contains(msg, "unique constraint failed") {
		return true
	}
	// MySQL: duplicate entry
	if strings.Contains(msg, "duplicate entry") {
		return true
	}
	// เผื่อข้อความอื่น ๆ
	if strings.Contains(msg, "unique") && strings.Contains(msg, "duplicate") {
		return true
	}
	return false
}

func (s *reviewService) CreateReview(req dto.CreateReviewRequest) (*entity.Review, error) {
	// ✅ เปลี่ยน: ให้เป็น validation error เพื่อ map เป็น 400
	if req.MainCategoryID == nil {
		return nil, ValidationError{Msg: "main_category_id is required"}
	}

	review := &entity.Review{
		Title:       strings.TrimSpace(req.Title),   // ✅ เพิ่ม trim
		Content:     strings.TrimSpace(req.Content), // ✅ เพิ่ม trim
		Rating:      req.Rating,
		IsAnonymous: req.IsAnonymous,

		MemberID: req.MemberID,

		MainCategoryID:  req.MainCategoryID,
		SubCategoryL1ID: req.SubCategoryL1ID,
		SubCategoryL2ID: req.SubCategoryL2ID,

		HelpfulCount:    0,
		NotHelpfulCount: 0,
	}

	// ✅ เพิ่ม: entity validate (ถ้าหนูแปะ Validate() ใน entity แล้ว)
	if err := review.Validate(); err != nil {
		return nil, ValidationError{Msg: err.Error()}
	}

	// 1) create review ก่อน เพื่อให้ได้ review.ID
	if err := s.reviewRepo.CreateReview(review); err != nil {
		return nil, err
	}

	// 2) hashtags: รวมทั้งที่ frontend ส่งมา + ที่พิมพ์ใน content (แบบ Twitter)
	allTags := make([]string, 0, len(req.Hashtags)+8)
	allTags = append(allTags, req.Hashtags...)
	allTags = append(allTags, extractHashtags(req.Content)...)

	if len(allTags) > 0 {
		seen := make(map[string]struct{}) // กันซ้ำใน request+content

		for _, raw := range allTags {
			name := normalizeTag(raw)
			if name == "" {
				continue
			}
			if _, ok := seen[name]; ok {
				continue
			}
			seen[name] = struct{}{}

			// 2.1 หา tag ก่อน
			tag, err := s.reviewRepo.FindTagByName(name)
			if err != nil {
				return nil, err
			}

			// 2.2 ไม่เจอ -> สร้างใหม่ (แต่ต้องกันชน unique)
			if tag == nil {
				newTag := &entity.Tag{Name: name}

				// ✅ เพิ่ม: tag validate (ถ้ามี Validate() ใน Tag)
				if err := newTag.Validate(); err != nil {
					return nil, ValidationError{Msg: err.Error()}
				}

				if err := s.reviewRepo.CreateTag(newTag); err != nil {
					// ถ้าชน unique เพราะมีคนสร้างพร้อมกัน -> หาใหม่แล้วใช้ต่อ
					if isUniqueConstraintError(err) {
						tag, err = s.reviewRepo.FindTagByName(name)
						if err != nil {
							return nil, err
						}
						if tag == nil {
							// กันเคสแปลก ๆ
							return nil, err
						}
					} else {
						return nil, err
					}
				} else {
					tag = newTag
				}
			}

			// 2.3 ผูก review <-> tag
			if err := s.reviewRepo.AttachTagToReview(review.ID, tag.ID); err != nil {
				// ถ้าเธอใส่ unique (review_id, tag_id) แล้วเจอซ้ำ -> ไม่ต้อง fail
				if !isUniqueConstraintError(err) {
					return nil, err
				}
			}
		}
	}

	// ❗images จะมาใน endpoint upload แยก

	// ✅ โหลดใหม่พร้อม preload ก่อนส่งกลับ
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

		// ✅ เพิ่ม: validate image
		if err := row.Validate(); err != nil {
			return ValidationError{Msg: err.Error()}
		}

		if err := s.reviewRepo.CreateReviewImage(row); err != nil {
			return err
		}
	}

	return nil
}

// ListReviews ดึงรีวิวทั้งหมด (optionally กรองด้วย mainCategoryID)?
func (s *reviewService) ListReviews(mainCategoryID *uint) ([]entity.Review, error) {
	return s.reviewRepo.ListReviewsByCategory(mainCategoryID)
}

// DeleteReview จะตรวจสอบสิทธิ์การลบด้วย memberID
func (s *reviewService) DeleteReview(reviewID uint, memberID uint) error {
	return s.reviewRepo.DeleteReviewByID(reviewID, memberID)
}

// VoteReview จะจัดการโหวตรีวิวทุกเคส
func (s *reviewService) VoteReview(reviewID uint, memberID uint, voteType string) (*dto.VoteReviewResponse, error) {
	h, n, myVote, action, err := s.reviewRepo.ToggleReviewVote(reviewID, memberID, voteType)
	if err != nil {
		// vote_type ผิด = validation error -> 400
		msg := strings.ToLower(err.Error())
		if strings.Contains(msg, "invalid vote_type") {
			return nil, ValidationError{Msg: err.Error()}
		}
		return nil, err
	}

	return &dto.VoteReviewResponse{
		ReviewID:        reviewID,
		HelpfulCount:    h,
		NotHelpfulCount: n,
		MyVoteType:      myVote,
		Action:          action,
	}, nil
}
