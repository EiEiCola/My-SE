package tests

import (
	"testing"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/sut68/team12/backend/internal/entity"
)

func TestCommentValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run(`Is completely valid`, func(t *testing.T) {
		comment := entity.Comment{
			PostID:      1,
			AuthorID:    1,
			Content:     "This is a valid comment.",
		}

		ok, err := govalidator.ValidateStruct(comment)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})
}

func TestCommentPostIDRequiredValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run(`Comment PostID is required`, func(t *testing.T) {
		comment := entity.Comment{
			PostID:      0,
			AuthorID:    1,
			Content:     "This is a valid comment.",
		}

		ok, err := govalidator.ValidateStruct(comment)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).ToNot(BeNil())

		g.Expect(err.Error()).To(Equal("PostID is required"))
	})
}

func TestCommentAuthorIDRequiredValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run(`Comment AuthorID is required`, func(t *testing.T) {
		comment := entity.Comment{
			PostID:      1,
			AuthorID:    0,
			Content:     "This is a valid comment.",
		}

		ok, err := govalidator.ValidateStruct(comment)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).ToNot(BeNil())

		g.Expect(err.Error()).To(Equal("AuthorID is required"))
	})
}

func TestCommentContentRequiredValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run(`Comment Content is required`, func(t *testing.T) {
		comment := entity.Comment{
			PostID:      1,
			AuthorID:    1,
			Content:     "",
		}

		ok, err := govalidator.ValidateStruct(comment)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).ToNot(BeNil())

		g.Expect(err.Error()).To(Equal("Content is required"))
	})
}

func TestCommentContentLengthValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run(`Comment Content length exceeds 1000 characters`, func(t *testing.T) {
		longContent := ""
		for i := 0; i < 1001; i++ {
			longContent += "a"
		}
		comment := entity.Comment{
			PostID:      1,
			AuthorID:    1,
			Content:     longContent,
		}

		ok, err := govalidator.ValidateStruct(comment)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).ToNot(BeNil())

		g.Expect(err.Error()).To(Equal("Content must be between 1 and 1000 characters"))
	})
}