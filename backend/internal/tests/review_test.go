package tests

import (
	"testing"

	"github.com/sut68/team12/backend/internal/entity"
)

func TestReviewValidate_OK(t *testing.T) {
	mainID := uint(1)
	r := entity.Review{
		Title:          "Good course",
		Content:        "Very helpful and well explained.",
		Rating:         5,
		MemberID:       1,
		MainCategoryID: &mainID,
	}
	if err := r.Validate(); err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
}

func TestReviewValidate_MissingMainCategory(t *testing.T) {
	r := entity.Review{
		Title:   "Good course",
		Content: "Very helpful and well explained.",
		Rating:  5,
		MemberID: 1,
		// MainCategoryID nil
	}
	if err := r.Validate(); err == nil {
		t.Fatalf("expected error, got nil")
	}
}
