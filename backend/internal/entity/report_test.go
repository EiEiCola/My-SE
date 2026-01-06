package entity_test

import (
	"testing"

	. "github.com/onsi/gomega"
	"github.com/sut68/team12/backend/internal/entity"
)

func TestReport(t *testing.T) {
	g := NewGomegaWithT(t)

	// Positive Case
	t.Run("should pass validation with valid data", func(t *testing.T) {
		r := entity.Report{
			Title:       "Bug Report",
			Description: "Something is broken",
			TargetType:  "system",
		}
		ok, err := entity.ValidateReport(r)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	// Negative Case 1: Missing Title
	t.Run("should fail validation when Title is missing", func(t *testing.T) {
		r := entity.Report{
			Title:       "",
			Description: "Desc",
			TargetType:  "system",
		}
		ok, err := entity.ValidateReport(r)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).ToNot(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("Title is required"))
	})

	// Negative Case 2: Missing Description
	t.Run("should fail validation when Description is missing", func(t *testing.T) {
		r := entity.Report{
			Title:       "Title",
			Description: "",
			TargetType:  "system",
		}
		ok, err := entity.ValidateReport(r)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).ToNot(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("Description is required"))
	})

	// Negative Case 3: Missing TargetType
	t.Run("should fail validation when TargetType is missing", func(t *testing.T) {
		r := entity.Report{
			Title:       "Title",
			Description: "Desc",
			TargetType:  "",
		}
		ok, err := entity.ValidateReport(r)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).ToNot(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("TargetType is required"))
	})
}
