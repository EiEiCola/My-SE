package tests

import (
	"testing"

	"github.com/sut68/team12/backend/internal/entity"
)

func TestReviewImageValidate_OK(t *testing.T) {
	img := entity.ReviewImage{
		ReviewID:  1,
		URL:       "/uploads/reviews/x.jpg",
		SortOrder: 1,
	}
	if err := img.Validate(); err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
}

func TestReviewImageValidate_MissingURL(t *testing.T) {
	img := entity.ReviewImage{
		ReviewID:  1,
		URL:       "   ",
		SortOrder: 1,
	}
	if err := img.Validate(); err == nil {
		t.Fatalf("expected error, got nil")
	}
}
