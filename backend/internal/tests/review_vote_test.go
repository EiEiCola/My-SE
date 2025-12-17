package tests

import (
	"testing"

	"github.com/sut68/team12/backend/internal/entity"
)

func TestReviewVoteValidate_InvalidType(t *testing.T) {
	v := entity.ReviewVote{
		ReviewID: 1,
		MemberID: 1,
		VoteType: "like",
	}
	if err := v.Validate(); err == nil {
		t.Fatalf("expected error, got nil")
	}
}

func TestReviewVoteValidate_OK(t *testing.T) {
	v := entity.ReviewVote{
		ReviewID: 1,
		MemberID: 1,
		VoteType: "helpful",
	}
	if err := v.Validate(); err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
}
