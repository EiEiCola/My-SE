package tests

import (
	"testing"

	. "github.com/onsi/gomega"
	"github.com/sut68/team12/backend/internal/entity"
)

func TestReviewVoteValidation(t *testing.T) {

	t.Run("Positive: valid vote helpful", func(t *testing.T) {
		g := NewGomegaWithT(t)

		v := entity.ReviewVote{VoteType: "helpful", ReviewID: 1, MemberID: 1}
		ok, err := entity.ValidateReviewVote(v)

		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Positive: voteType case-insensitive and trims spaces", func(t *testing.T) {
		g := NewGomegaWithT(t)

		v := entity.ReviewVote{VoteType: "  HeLpFuL  ", ReviewID: 1, MemberID: 1}
		ok, err := entity.ValidateReviewVote(v)

		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Negative: VoteType empty", func(t *testing.T) {
		g := NewGomegaWithT(t)

		v := entity.ReviewVote{VoteType: "", ReviewID: 1, MemberID: 1}
		ok, err := entity.ValidateReviewVote(v)

		g.Expect(ok).To(BeFalse())
		g.Expect(err.Error()).To(Equal("VoteType is required"))
	})

	t.Run("Negative: VoteType only spaces", func(t *testing.T) {
		g := NewGomegaWithT(t)

		v := entity.ReviewVote{VoteType: "   ", ReviewID: 1, MemberID: 1}
		ok, err := entity.ValidateReviewVote(v)

		g.Expect(ok).To(BeFalse())
		g.Expect(err.Error()).To(Equal("VoteType is required"))
	})

	t.Run("Negative: VoteType invalid", func(t *testing.T) {
		g := NewGomegaWithT(t)

		v := entity.ReviewVote{VoteType: "like", ReviewID: 1, MemberID: 1}
		ok, err := entity.ValidateReviewVote(v)

		g.Expect(ok).To(BeFalse())
		g.Expect(err.Error()).To(Equal("VoteType must be helpful or not_helpful"))
	})

	t.Run("Negative: ReviewID missing", func(t *testing.T) {
		g := NewGomegaWithT(t)

		v := entity.ReviewVote{VoteType: "helpful", ReviewID: 0, MemberID: 1}
		ok, err := entity.ValidateReviewVote(v)

		g.Expect(ok).To(BeFalse())
		g.Expect(err.Error()).To(Equal("ReviewID is required"))
	})

	t.Run("Negative: MemberID missing", func(t *testing.T) {
		g := NewGomegaWithT(t)

		v := entity.ReviewVote{VoteType: "helpful", ReviewID: 1, MemberID: 0}
		ok, err := entity.ValidateReviewVote(v)

		g.Expect(ok).To(BeFalse())
		g.Expect(err.Error()).To(Equal("MemberID is required"))
	})
}
