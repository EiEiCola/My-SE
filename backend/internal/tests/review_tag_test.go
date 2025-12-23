package tests

import (
	"testing"

	. "github.com/onsi/gomega"
	"github.com/sut68/team12/backend/internal/entity"
)

func TestReviewTagValidation(t *testing.T) {

	t.Run("Positive: valid review_tag", func(t *testing.T) {
		g := NewGomegaWithT(t)

		rt := entity.ReviewTag{ReviewID: 1, TagID: 2}
		ok, err := entity.ValidateReviewTag(rt)

		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Negative: ReviewID missing", func(t *testing.T) {
		g := NewGomegaWithT(t)

		rt := entity.ReviewTag{ReviewID: 0, TagID: 2}
		ok, err := entity.ValidateReviewTag(rt)

		g.Expect(ok).To(BeFalse())
		g.Expect(err.Error()).To(Equal("ReviewID is required"))
	})

	t.Run("Negative: TagID missing", func(t *testing.T) {
		g := NewGomegaWithT(t)

		rt := entity.ReviewTag{ReviewID: 1, TagID: 0}
		ok, err := entity.ValidateReviewTag(rt)

		g.Expect(ok).To(BeFalse())
		g.Expect(err.Error()).To(Equal("TagID is required"))
	})

	t.Run("Negative: both missing", func(t *testing.T) {
		g := NewGomegaWithT(t)

		rt := entity.ReviewTag{ReviewID: 0, TagID: 0}
		ok, err := entity.ValidateReviewTag(rt)

		g.Expect(ok).To(BeFalse())
		// ฟังก์ชันจะเจอ ReviewID ก่อน
		g.Expect(err.Error()).To(Equal("ReviewID is required"))
	})
}
