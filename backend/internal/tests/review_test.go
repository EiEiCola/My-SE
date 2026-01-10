package tests

import (
	"testing"

	. "github.com/onsi/gomega"
	"github.com/sut68/team12/backend/internal/entity"
)

func uPtr(v uint) *uint { return &v }
func TestReviewValidation(t *testing.T) {

	t.Run("Positive: valid review", func(t *testing.T) {
		g := NewGomegaWithT(t)

		r := entity.Review{
			Title:           "หัวข้อ",
			Content:         "เนื้อหา",
			Rating:          5,
			MemberID:        1,
			MainCategoryID:  uPtr(1),
			HelpfulCount:    0,
			NotHelpfulCount: 0,
		}

		ok, err := entity.ValidateReview(r)
		t.Logf("ok=%v err=%v", ok, err)

		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	// ---------- Title ----------
	t.Run("Negative: Title empty", func(t *testing.T) {
		g := NewGomegaWithT(t)

		r := entity.Review{
			Title:          "",
			Content:        "ok",
			Rating:         5,
			MemberID:       1,
			MainCategoryID: uPtr(1),
		}

		ok, err := entity.ValidateReview(r)
		t.Logf("ok=%v err=%v", ok, err)

		g.Expect(ok).To(BeFalse())
		g.Expect(err.Error()).To(Equal("Title is required"))
	})

	t.Run("Negative: Title only spaces", func(t *testing.T) {
		g := NewGomegaWithT(t)

		r := entity.Review{
			Title:          "   ",
			Content:        "ok",
			Rating:         5,
			MemberID:       1,
			MainCategoryID: uPtr(1),
		}

		ok, err := entity.ValidateReview(r)
		t.Logf("ok=%v err=%v", ok, err)

		g.Expect(ok).To(BeFalse())
		g.Expect(err.Error()).To(Equal("Title is required"))
	})

	// ---------- Content ----------
	t.Run("Negative: Content empty", func(t *testing.T) {
		g := NewGomegaWithT(t)

		r := entity.Review{
			Title:          "ok",
			Content:        "",
			Rating:         5,
			MemberID:       1,
			MainCategoryID: uPtr(1),
		}

		ok, err := entity.ValidateReview(r)
		t.Logf("ok=%v err=%v", ok, err)

		g.Expect(ok).To(BeFalse())
		g.Expect(err.Error()).To(Equal("Content is required"))
	})

	t.Run("Negative: Content only spaces", func(t *testing.T) {
		g := NewGomegaWithT(t)

		r := entity.Review{
			Title:          "ok",
			Content:        "   ",
			Rating:         5,
			MemberID:       1,
			MainCategoryID: uPtr(1),
		}

		ok, err := entity.ValidateReview(r)
		t.Logf("ok=%v err=%v", ok, err)

		g.Expect(ok).To(BeFalse())
		g.Expect(err.Error()).To(Equal("Content is required"))
	})

	// ---------- Rating ----------
	t.Run("Negative: Rating below 1", func(t *testing.T) {
		g := NewGomegaWithT(t)

		r := entity.Review{
			Title:          "ok",
			Content:        "ok",
			Rating:         0,
			MemberID:       1,
			MainCategoryID: uPtr(1),
		}

		ok, err := entity.ValidateReview(r)
		t.Logf("ok=%v err=%v", ok, err)

		g.Expect(ok).To(BeFalse())
		g.Expect(err.Error()).To(Equal("Rating must be between 1 and 5"))
	})

	t.Run("Negative: Rating above 5", func(t *testing.T) {
		g := NewGomegaWithT(t)

		r := entity.Review{
			Title:          "ok",
			Content:        "ok",
			Rating:         6,
			MemberID:       1,
			MainCategoryID: uPtr(1),
		}

		ok, err := entity.ValidateReview(r)
		t.Logf("ok=%v err=%v", ok, err)

		g.Expect(ok).To(BeFalse())
		g.Expect(err.Error()).To(Equal("Rating must be between 1 and 5"))
	})

	// ---------- MemberID ----------
	t.Run("Negative: MemberID is 0", func(t *testing.T) {
		g := NewGomegaWithT(t)

		r := entity.Review{
			Title:          "ok",
			Content:        "ok",
			Rating:         5,
			MemberID:       0,
			MainCategoryID: uPtr(1),
		}

		ok, err := entity.ValidateReview(r)
		t.Logf("ok=%v err=%v", ok, err)

		g.Expect(ok).To(BeFalse())
		g.Expect(err.Error()).To(Equal("MemberID is required"))
	})

	// ---------- MainCategoryID ----------
	t.Run("Negative: MainCategoryID is nil", func(t *testing.T) {
		g := NewGomegaWithT(t)

		r := entity.Review{
			Title:    "ok",
			Content:  "ok",
			Rating:   5,
			MemberID: 1,
		}

		ok, err := entity.ValidateReview(r)
		t.Logf("ok=%v err=%v", ok, err)

		g.Expect(ok).To(BeFalse())
		g.Expect(err.Error()).To(Equal("MainCategoryID is required"))
	})

	t.Run("Negative: MainCategoryID points to 0", func(t *testing.T) {
		g := NewGomegaWithT(t)

		zero := uint(0)
		r := entity.Review{
			Title:          "ok",
			Content:        "ok",
			Rating:         5,
			MemberID:       1,
			MainCategoryID: &zero,
		}

		ok, err := entity.ValidateReview(r)
		t.Logf("ok=%v err=%v", ok, err)

		g.Expect(ok).To(BeFalse())
		g.Expect(err.Error()).To(Equal("MainCategoryID is required"))
	})

	// ---------- Vote counts ----------
	t.Run("Negative: HelpfulCount negative", func(t *testing.T) {
		g := NewGomegaWithT(t)

		r := entity.Review{
			Title:          "ok",
			Content:        "ok",
			Rating:         5,
			MemberID:       1,
			MainCategoryID: uPtr(1),
			HelpfulCount:   -1,
		}

		ok, err := entity.ValidateReview(r)
		t.Logf("ok=%v err=%v", ok, err)

		g.Expect(ok).To(BeFalse())
		g.Expect(err.Error()).To(Equal("Vote counts must be non-negative"))
	})

	t.Run("Negative: NotHelpfulCount negative", func(t *testing.T) {
		g := NewGomegaWithT(t)

		r := entity.Review{
			Title:           "ok",
			Content:         "ok",
			Rating:          5,
			MemberID:        1,
			MainCategoryID:  uPtr(1),
			NotHelpfulCount: -1,
		}

		ok, err := entity.ValidateReview(r)
		t.Logf("ok=%v err=%v", ok, err)

		g.Expect(ok).To(BeFalse())
		g.Expect(err.Error()).To(Equal("Vote counts must be non-negative"))
	})

	// ---------- Subcategory rule ----------
	t.Run("Negative: SubCategoryL2 provided but SubCategoryL1 nil", func(t *testing.T) {
		g := NewGomegaWithT(t)

		r := entity.Review{
			Title:           "ok",
			Content:         "ok",
			Rating:          5,
			MemberID:        1,
			MainCategoryID:  uPtr(1),
			SubCategoryL2ID: uPtr(99),
			// SubCategoryL1ID nil
		}

		ok, err := entity.ValidateReview(r)
		t.Logf("ok=%v err=%v", ok, err)

		g.Expect(ok).To(BeFalse())
		g.Expect(err.Error()).To(Equal("SubCategoryL1ID is required when SubCategoryL2ID is provided"))
	})

	t.Run("Negative: SubCategoryL2 provided but SubCategoryL1 points to 0", func(t *testing.T) {
		g := NewGomegaWithT(t)

		zero := uint(0)
		r := entity.Review{
			Title:           "ok",
			Content:         "ok",
			Rating:          5,
			MemberID:        1,
			MainCategoryID:  uPtr(1),
			SubCategoryL2ID: uPtr(99),
			SubCategoryL1ID: &zero,
		}

		ok, err := entity.ValidateReview(r)
		t.Logf("ok=%v err=%v", ok, err)

		g.Expect(ok).To(BeFalse())
		g.Expect(err.Error()).To(Equal("SubCategoryL1ID is required when SubCategoryL2ID is provided"))
	})

	t.Run("Positive: SubCategoryL2 provided and SubCategoryL1 provided", func(t *testing.T) {
		g := NewGomegaWithT(t)

		r := entity.Review{
			Title:           "ok",
			Content:         "ok",
			Rating:          5,
			MemberID:        1,
			MainCategoryID:  uPtr(1),
			SubCategoryL1ID: uPtr(10),
			SubCategoryL2ID: uPtr(99),
		}

		ok, err := entity.ValidateReview(r)
		t.Logf("ok=%v err=%v", ok, err)

		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})
}
