package repository

import (
    "errors"
    "github.com/sut68/team12/backend/internal/entity"
    "gorm.io/gorm"
)

type ReviewRepository interface {
    CreateReview(review *entity.Review) error
    FindReviewByID(id uint) (*entity.Review, error)
    ListReviewsByCategory(mainCategoryID *uint) ([]entity.Review, error)

    // Tags
    FindTagByName(name string) (*entity.Tag, error)
    CreateTag(tag *entity.Tag) error
    AttachTagToReview(reviewID uint, tagID uint) error

    // Images
    CreateReviewImage(img *entity.ReviewImage) error

    // Vote (optional เดี๋ยวเพิ่มใน service)
    CreateOrUpdateVote(vote *entity.ReviewVote) error
}

type reviewRepository struct {
    db *gorm.DB
}

func NewReviewRepository(db *gorm.DB) ReviewRepository {
    return &reviewRepository{db: db}
}

// ------------------------------------
// Create Review
// ------------------------------------
func (r *reviewRepository) CreateReview(review *entity.Review) error {
    return r.db.Create(review).Error
}

// ------------------------------------
// Get review by ID (พร้อม preload)
// ------------------------------------
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

// ------------------------------------
// List reviews by category (สำหรับหน้า list)
// ------------------------------------
func (r *reviewRepository) ListReviewsByCategory(mainCategoryID *uint) ([]entity.Review, error) {
    var reviews []entity.Review

    q := r.db.
        Preload("Member").
        Preload("Tags").
        Preload("ReviewImages")

    if mainCategoryID != nil {
        q = q.Where("main_category_id = ?", *mainCategoryID)
    }

    err := q.Order("created_at DESC").Find(&reviews).Error
    return reviews, err
}

// ------------------------------------
// TAG FUNCTIONS
// ------------------------------------
func (r *reviewRepository) FindTagByName(name string) (*entity.Tag, error) {
    var tag entity.Tag
    err := r.db.Where("name = ?", name).First(&tag).Error

    if errors.Is(err, gorm.ErrRecordNotFound) {
        return nil, nil // ไม่เจอ = ควรสร้างใหม่ใน Service
    }
    return &tag, err
}

func (r *reviewRepository) CreateTag(tag *entity.Tag) error {
    return r.db.Create(tag).Error
}

func (r *reviewRepository) AttachTagToReview(reviewID uint, tagID uint) error {
    reviewTag := entity.ReviewTag{
        ReviewID: reviewID,
        TagID:    tagID,
    }
    return r.db.Create(&reviewTag).Error
}

// ------------------------------------
// IMAGE FUNCTIONS
// ------------------------------------
func (r *reviewRepository) CreateReviewImage(img *entity.ReviewImage) error {
    return r.db.Create(img).Error
}

// ------------------------------------
// VOTE (ถ้าอยาก update/replace vote เดี๋ยวไปทำใน service)
// ------------------------------------
func (r *reviewRepository) CreateOrUpdateVote(vote *entity.ReviewVote) error {
    return r.db.Save(vote).Error
}
