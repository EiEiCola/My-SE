package tests

import (
	"testing"

	. "github.com/onsi/gomega"
	"github.com/sut68/team12/backend/internal/entity"
)

func TestReviewImageValidation(t *testing.T) {

	t.Run("Positive: valid image", func(t *testing.T) {
		g := NewGomegaWithT(t)

		img := entity.ReviewImage{URL: "/uploads/reviews/a.png", ReviewID: 1, SortOrder: 1}
		ok, err := entity.ValidateReviewImage(img)

		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Negative: URL empty", func(t *testing.T) {
		g := NewGomegaWithT(t)

		img := entity.ReviewImage{URL: "", ReviewID: 1, SortOrder: 1}
		ok, err := entity.ValidateReviewImage(img)

		g.Expect(ok).To(BeFalse())
		g.Expect(err.Error()).To(Equal("URL is required"))
	})

	t.Run("Negative: URL only spaces", func(t *testing.T) {
		g := NewGomegaWithT(t)

		img := entity.ReviewImage{URL: "   ", ReviewID: 1, SortOrder: 1}
		ok, err := entity.ValidateReviewImage(img)

		g.Expect(ok).To(BeFalse())
		g.Expect(err.Error()).To(Equal("URL is required"))
	})

	t.Run("Negative: ReviewID missing", func(t *testing.T) {
		g := NewGomegaWithT(t)

		img := entity.ReviewImage{URL: "/x.png", ReviewID: 0, SortOrder: 1}
		ok, err := entity.ValidateReviewImage(img)

		g.Expect(ok).To(BeFalse())
		g.Expect(err.Error()).To(Equal("ReviewID is required"))
	})

	t.Run("Negative: SortOrder 0", func(t *testing.T) {
		g := NewGomegaWithT(t)

		img := entity.ReviewImage{URL: "/x.png", ReviewID: 1, SortOrder: 0}
		ok, err := entity.ValidateReviewImage(img)

		g.Expect(ok).To(BeFalse())
		g.Expect(err.Error()).To(Equal("SortOrder must be greater than 0"))
	})

	t.Run("Negative: SortOrder negative", func(t *testing.T) {
		g := NewGomegaWithT(t)

		img := entity.ReviewImage{URL: "/x.png", ReviewID: 1, SortOrder: -1}
		ok, err := entity.ValidateReviewImage(img)

		g.Expect(ok).To(BeFalse())
		g.Expect(err.Error()).To(Equal("SortOrder must be greater than 0"))
	})
}
