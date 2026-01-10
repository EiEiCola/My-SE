package tests

import (
	"testing"
	"time"

	. "github.com/onsi/gomega"
	"github.com/sut68/team12/backend/internal/entity"
)

func TestPollValidationForSubmission(t *testing.T) {

	t.Run("Positive #1: valid poll (single choice)", func(t *testing.T) {
		g := NewGomegaWithT(t)

		p := entity.Poll{
			Question:      "กินข้าวที่ไหน?",
			AllowMultiple: false,
			Options: []entity.PollOption{
				{Label: "โรงอาหาร A", SortOrder: 1},
				{Label: "โรงอาหาร B", SortOrder: 2},
			},
		}

		ok, err := entity.ValidatePollForSubmission(p)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Positive #2: valid poll (multiple choice + max_choice)", func(t *testing.T) {
		g := NewGomegaWithT(t)

		max := 2
		p := entity.Poll{
			Question:      "ชอบผลไม้อะไรบ้าง?",
			AllowMultiple: true,
			MaxChoice:     &max,
			Options: []entity.PollOption{
				{Label: "แอปเปิ้ล", SortOrder: 1},
				{Label: "กล้วย", SortOrder: 2},
				{Label: "ส้ม", SortOrder: 3},
			},
		}

		ok, err := entity.ValidatePollForSubmission(p)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Positive #3: valid poll (start/end valid)", func(t *testing.T) {
		g := NewGomegaWithT(t)

		start := time.Now().Add(1 * time.Hour)
		end := time.Now().Add(2 * time.Hour)

		p := entity.Poll{
			Question:      "โหวตเวลาไหนดี?",
			AllowMultiple: false,
			StartAt:       &start,
			EndAt:         &end,
			Options: []entity.PollOption{
				{Label: "เช้า", SortOrder: 1},
				{Label: "บ่าย", SortOrder: 2},
			},
		}

		ok, err := entity.ValidatePollForSubmission(p)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Negative: question empty", func(t *testing.T) {
		g := NewGomegaWithT(t)

		p := entity.Poll{
			Question:      "   ",
			AllowMultiple: false,
			Options: []entity.PollOption{
				{Label: "A", SortOrder: 1},
				{Label: "B", SortOrder: 2},
			},
		}

		ok, err := entity.ValidatePollForSubmission(p)
		g.Expect(ok).To(BeFalse())
		g.Expect(err.Error()).To(Equal("question is required"))
	})
}
