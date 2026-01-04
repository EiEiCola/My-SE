package repository

import (
	"errors"
	"strings"

	"github.com/sut68/team12/backend/internal/entity"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type ReviewRepository interface {
	CreateReview(review *entity.Review) error
	FindReviewByID(id uint) (*entity.Review, error)
	ListReviewsByCategory(mainCategoryID *uint) ([]entity.Review, error)
	DeleteReviewByID(reviewID uint, memberID uint) error

	ListMyReviews(memberID uint, mainCategoryID *uint) ([]entity.Review, error)

	// ✅ owner check
	CheckReviewOwner(reviewID uint, memberID uint) error

	// Tags
	FindTagByName(name string) (*entity.Tag, error)
	CreateTag(tag *entity.Tag) error
	AttachTagToReview(reviewID uint, tagID uint) error

	// Images
	CreateReviewImage(img *entity.ReviewImage) error

	// Vote
	CreateOrUpdateVote(vote *entity.ReviewVote) error
	ToggleReviewVote(reviewID uint, memberID uint, voteType string) (helpful int, notHelpful int, myVote *string, action string, err error)
}

type reviewRepository struct {
	db *gorm.DB
}

func NewReviewRepository(db *gorm.DB) ReviewRepository {
	return &reviewRepository{db: db}
}

func (r *reviewRepository) CreateReview(review *entity.Review) error {
	return r.db.Create(review).Error
}

func (r *reviewRepository) FindReviewByID(id uint) (*entity.Review, error) {
	var review entity.Review
	err := r.db.
		Preload("Member").
		Preload("ReviewImages").
		Preload("ReviewVotes").
		Preload("Tags").
		Preload("MainCategory").
		Preload("SubCategoryL1").
		Preload("SubCategoryL2").
		First(&review, id).Error
	if err != nil {
		return nil, err
	}
	return &review, nil
}

func (r *reviewRepository) ListReviewsByCategory(mainCategoryID *uint) ([]entity.Review, error) {
	var reviews []entity.Review

	q := r.db.
		Preload("Member").
		Preload("Tags").
		Preload("ReviewImages").
		Preload("MainCategory").
		Preload("SubCategoryL1").
		Preload("SubCategoryL2")

	if mainCategoryID != nil {
		q = q.Where("main_category_id = ?", *mainCategoryID)
	}

	err := q.Order("created_at DESC").Find(&reviews).Error
	return reviews, err
}

func (r *reviewRepository) DeleteReviewByID(reviewID uint, memberID uint) error {
	tx := r.db.Where("id = ? AND member_id = ?", reviewID, memberID).Delete(&entity.Review{})
	if tx.Error != nil {
		return tx.Error
	}
	if tx.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

// ✅ เช็คว่า review นี้เป็นของ member คนนี้ไหม
func (r *reviewRepository) CheckReviewOwner(reviewID uint, memberID uint) error {
	var tmp entity.Review
	err := r.db.Select("id").Where("id = ? AND member_id = ?", reviewID, memberID).First(&tmp).Error
	return err // ถ้าไม่เจอ = gorm.ErrRecordNotFound
}

// TAG
func (r *reviewRepository) FindTagByName(name string) (*entity.Tag, error) {
	var tags []entity.Tag
	// ใช้ Find แทน First เพื่อไม่ให้พ่น record not found log
	err := r.db.Where("name = ?", name).Limit(1).Find(&tags).Error
	if err != nil {
		return nil, err
	}
	if len(tags) == 0 {
		return nil, nil
	}
	return &tags[0], nil
}

func (r *reviewRepository) CreateTag(tag *entity.Tag) error {
	return r.db.Create(tag).Error
}

func (r *reviewRepository) AttachTagToReview(reviewID uint, tagID uint) error {
	rt := entity.ReviewTag{ReviewID: reviewID, TagID: tagID}
	return r.db.
		Where("review_id = ? AND tag_id = ?", reviewID, tagID).
		FirstOrCreate(&rt).Error
}

// IMAGE
func (r *reviewRepository) CreateReviewImage(img *entity.ReviewImage) error {
	return r.db.Create(img).Error
}

// VOTE
func (r *reviewRepository) CreateOrUpdateVote(vote *entity.ReviewVote) error {
	return r.db.Save(vote).Error
}

// ToggleReviewVote จะจัดการโหวตรีวิวทุกเคส
func (r *reviewRepository) ToggleReviewVote(
	reviewID uint,
	memberID uint,
	voteType string,
) (int, int, *string, string, error) {

	vt := strings.ToLower(strings.TrimSpace(voteType))
	if vt != "helpful" && vt != "not_helpful" {
		return 0, 0, nil, "", errors.New("invalid vote_type (must be helpful or not_helpful)")
	}

	var helpful, notHelpful int
	var myVote *string
	action := ""

	err := r.db.Transaction(func(tx *gorm.DB) error {
		// lock review row กัน count เพี้ยน
		var review entity.Review
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			First(&review, reviewID).Error; err != nil {
			return err
		}

		// ใช้ Find แทน First เพื่อเลี่ยง Log "record not found" ตัวแดง
		var votes []entity.ReviewVote
		err := tx.Where("review_id = ? AND member_id = ?", reviewID, memberID).Limit(1).Find(&votes).Error
		if err != nil {
			return err
		}

		// เคส 1: ยังไม่เคยโหวต (len == 0)
		if len(votes) == 0 {
			vote := entity.ReviewVote{ReviewID: reviewID, MemberID: memberID, VoteType: vt}
			if err := tx.Create(&vote).Error; err != nil {
				return err
			}

			if vt == "helpful" {
				review.HelpfulCount++
			} else {
				review.NotHelpfulCount++
			}
			myVote = &vt
			action = "voted"

		} else {
			// เคส 2: เคยโหวตแล้ว
			vote := votes[0]
			if strings.ToLower(vote.VoteType) == vt {
				// กดซ้ำแบบเดิม = ถอน (ใช้ Unscoped เพื่อ Hard Delete)
				if err := tx.Unscoped().Delete(&vote).Error; err != nil {
					return err
				}
				if vt == "helpful" && review.HelpfulCount > 0 {
					review.HelpfulCount--
				}
				if vt == "not_helpful" && review.NotHelpfulCount > 0 {
					review.NotHelpfulCount--
				}
				myVote = nil
				action = "unvoted"

			} else {
				// เคส 3: สลับโหวต
				old := strings.ToLower(vote.VoteType)
				vote.VoteType = vt
				if err := tx.Save(&vote).Error; err != nil {
					return err
				}

				if old == "helpful" && review.HelpfulCount > 0 {
					review.HelpfulCount--
				}
				if old == "not_helpful" && review.NotHelpfulCount > 0 {
					review.NotHelpfulCount--
				}
				if vt == "helpful" {
					review.HelpfulCount++
				} else {
					review.NotHelpfulCount++
				}

				myVote = &vt
				action = "switched"
			}
		}

		// update counts ลง reviews
		if err := tx.Model(&entity.Review{}).
			Where("id = ?", reviewID).
			Updates(map[string]any{
				"helpful_count":     review.HelpfulCount,
				"not_helpful_count": review.NotHelpfulCount,
			}).Error; err != nil {
			return err
		}

		helpful = review.HelpfulCount
		notHelpful = review.NotHelpfulCount
		return nil
	})

	if err != nil {
		return 0, 0, nil, "", err
	}
	return helpful, notHelpful, myVote, action, nil
}

func (r *reviewRepository) ListMyReviews(memberID uint, mainCategoryID *uint) ([]entity.Review, error) {
	var reviews []entity.Review

	q := r.db.
		Preload("Member").
		Preload("Tags").
		Preload("ReviewImages").
		Preload("MainCategory").
		Preload("SubCategoryL1").
		Preload("SubCategoryL2").
		Where("member_id = ?", memberID)

	if mainCategoryID != nil {
		q = q.Where("main_category_id = ?", *mainCategoryID)
	}

	err := q.Order("created_at DESC").Find(&reviews).Error
	return reviews, err
}