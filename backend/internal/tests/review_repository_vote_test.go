package tests

import (
	"testing"

	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/entity"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func newTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open db: %v", err)
	}

	if err := db.AutoMigrate(
		&entity.Member{},
		&entity.MainCategory{},
		&entity.SubCategoryL1{},
		&entity.SubCategoryL2{},
		&entity.Review{},
		&entity.Tag{},
		&entity.ReviewTag{},
		&entity.ReviewImage{},
		&entity.ReviewVote{},
	); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	return db
}

func seedReview(t *testing.T, db *gorm.DB) (reviewID uint, memberID uint) {
	t.Helper()

	if err := db.Create(&entity.Member{Model: gorm.Model{ID: 1}, Username: "u1"}).Error; err != nil {
		t.Fatalf("seed member: %v", err)
	}
	if err := db.Create(&entity.MainCategory{Model: gorm.Model{ID: 1}}).Error; err != nil {
		t.Fatalf("seed main category: %v", err)
	}
	mainID := uint(1)

	review := entity.Review{
		Title:          "T1",
		Content:        "Content long enough....",
		Rating:         5,
		MemberID:       1,
		MainCategoryID: &mainID,
	}
	if err := db.Create(&review).Error; err != nil {
		t.Fatalf("seed review: %v", err)
	}

	return review.ID, 1
}

func TestToggleReviewVote_Flow(t *testing.T) {
	db := newTestDB(t)
	repo := repository.NewReviewRepository(db)

	reviewID, memberID := seedReview(t, db)

	// 1) vote helpful
	help, notHelp, myVote, action, err := repo.ToggleReviewVote(reviewID, memberID, "helpful")
	if err != nil {
		t.Fatalf("vote helpful err: %v", err)
	}
	if help != 1 || notHelp != 0 || action != "voted" || myVote == nil || *myVote != "helpful" {
		t.Fatalf("unexpected: help=%d not=%d action=%s myVote=%v", help, notHelp, action, myVote)
	}

	// 2) click helpful again => unvoted
	help, notHelp, myVote, action, err = repo.ToggleReviewVote(reviewID, memberID, "helpful")
	if err != nil {
		t.Fatalf("unvote err: %v", err)
	}
	if help != 0 || notHelp != 0 || action != "unvoted" || myVote != nil {
		t.Fatalf("unexpected after unvote: help=%d not=%d action=%s myVote=%v", help, notHelp, action, myVote)
	}

	// 3) vote not_helpful
	help, notHelp, myVote, action, err = repo.ToggleReviewVote(reviewID, memberID, "not_helpful")
	if err != nil {
		t.Fatalf("vote not_helpful err: %v", err)
	}
	if help != 0 || notHelp != 1 || action != "voted" || myVote == nil || *myVote != "not_helpful" {
		t.Fatalf("unexpected: help=%d not=%d action=%s myVote=%v", help, notHelp, action, myVote)
	}

	// 4) switch to helpful
	help, notHelp, myVote, action, err = repo.ToggleReviewVote(reviewID, memberID, "helpful")
	if err != nil {
		t.Fatalf("switch err: %v", err)
	}
	if help != 1 || notHelp != 0 || action != "switched" || myVote == nil || *myVote != "helpful" {
		t.Fatalf("unexpected after switch: help=%d not=%d action=%s myVote=%v", help, notHelp, action, myVote)
	}
}
