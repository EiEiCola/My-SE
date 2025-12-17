package tests

import (
	"strings"
	"testing"

	. "github.com/onsi/gomega"
	"github.com/sut68/team12/backend/internal/entity"
)

func TestTagValidation(t *testing.T) {

	t.Run("Positive: valid tag", func(t *testing.T) {
		g := NewGomegaWithT(t)

		tag := entity.Tag{Name: "sut"}
		ok, err := entity.ValidateTag(tag)

		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Positive: tag with spaces around still valid", func(t *testing.T) {
		g := NewGomegaWithT(t)

		tag := entity.Tag{Name: "  sut  "}
		ok, err := entity.ValidateTag(tag)

		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Negative: empty tag name", func(t *testing.T) {
		g := NewGomegaWithT(t)

		tag := entity.Tag{Name: ""}
		ok, err := entity.ValidateTag(tag)

		g.Expect(ok).To(BeFalse())
		g.Expect(err.Error()).To(Equal("Tag name is required"))
	})

	t.Run("Negative: tag name only spaces", func(t *testing.T) {
		g := NewGomegaWithT(t)

		tag := entity.Tag{Name: "   "}
		ok, err := entity.ValidateTag(tag)

		g.Expect(ok).To(BeFalse())
		g.Expect(err.Error()).To(Equal("Tag name is required"))
	})

	t.Run("Positive: length 100 is ok", func(t *testing.T) {
		g := NewGomegaWithT(t)

		tag := entity.Tag{Name: strings.Repeat("a", 100)}
		ok, err := entity.ValidateTag(tag)

		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Negative: length 101 is too long", func(t *testing.T) {
		g := NewGomegaWithT(t)

		tag := entity.Tag{Name: strings.Repeat("a", 101)}
		ok, err := entity.ValidateTag(tag)

		g.Expect(ok).To(BeFalse())
		g.Expect(err.Error()).To(Equal("Tag name must be 1-100 characters"))
	})
}
