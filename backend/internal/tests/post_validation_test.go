package tests

import (
	"testing"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/sut68/team12/backend/internal/entity"
)

func TestPostValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run(`Is completely valid`, func(t *testing.T) {
		post := entity.Post{
			AuthorID:    1,
			Title:       "Valid Post Title",
			Content:     "This is a valid content for the post.",
			Status:      "active",
		}

		ok, err := govalidator.ValidateStruct(post)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})
}

func TestPostAuthorIDRequiredValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run(`Post AuthorID is required`, func(t *testing.T) {
		post := entity.Post{
			AuthorID:    0,
			Title:       "Valid Post Title",
			Content:     "This is a valid content for the post.",
			Status:      "active",
		}

		ok, err := govalidator.ValidateStruct(post)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).ToNot(BeNil())

		g.Expect(err.Error()).To(Equal("AuthorID is required"))
	})
}
func TestPostTitleRequiredValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run(`Post Title is required`, func(t *testing.T) {
		post := entity.Post{
			AuthorID:    1,
			Title:       "",
			Content:     "This is a valid content for the post.",
			Status:      "active",
		}

		ok, err := govalidator.ValidateStruct(post)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).ToNot(BeNil())

		g.Expect(err.Error()).To(Equal("Title is required"))
	})

}

func TestPostLengthValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run(`Post Title length less than 5 characters`, func(t *testing.T) {
		post := entity.Post{
			AuthorID:    1,
			Title:       "Post",
			Content:     "This is a valid content for the post.",
			Status:      "active",
		}

		ok, err := govalidator.ValidateStruct(post)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).ToNot(BeNil())

		g.Expect(err.Error()).To(Equal("Title must be between 5 and 120 characters"))
	})

	t.Run(`Post Title length more than 120 characters`, func(t *testing.T) {
		post := entity.Post{
			AuthorID:    1,
			Title:       "This is a very long post title that exceeds the maximum allowed length of one hundred and twenty characters. It should trigger a validation error.",
			Content:     "This is a valid content for the post.",
			Status:      "active",
		}

		ok, err := govalidator.ValidateStruct(post)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).ToNot(BeNil())

		g.Expect(err.Error()).To(Equal("Title must be between 5 and 120 characters"))
	})
}

func TestPostContentRequiredValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run(`Post Content is required`, func(t *testing.T) {
		post := entity.Post{
			AuthorID:    1,
			Title:       "Valid Post Title",
			Content:     "",
			Status:      "active",
		}

		ok, err := govalidator.ValidateStruct(post)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).ToNot(BeNil())

		g.Expect(err.Error()).To(Equal("Content is required"))
	})
}

func TestPostContentLengthValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run(`Post Content length less than 1 character`, func(t *testing.T) {
		post := entity.Post{
			AuthorID:    1,
			Title:       "Valid Post Title",
			Content:     "",
			Status:      "active",
		}

		ok, err := govalidator.ValidateStruct(post)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).ToNot(BeNil())

		g.Expect(err.Error()).To(Equal("Content is required"))
	})

	t.Run(`Post Content length more than 2000 characters`, func(t *testing.T) {
		longContent := ""
		for i := 0; i < 2010; i++ {
			longContent += "a"
		}
		post := entity.Post{
			AuthorID:    1,
			Title:       "Valid Post Title",
			Content:     longContent,
			Status:      "active",
		}

		ok, err := govalidator.ValidateStruct(post)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).ToNot(BeNil())

		g.Expect(err.Error()).To(Equal("Content must be between 1 and 2000 characters"))
	})
}

func TestPostStatusValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run(`Post Status is invalid`, func(t *testing.T) {
		post := entity.Post{
			AuthorID:    1,
			Title:       "Valid Post Title",
			Content:     "This is a valid content for the post.",
			Status:      "invalid_status",
		}

		ok, err := govalidator.ValidateStruct(post)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).ToNot(BeNil())

		g.Expect(err.Error()).To(Equal("Status is invalid"))
	})

	t.Run(`Post Status is required`, func(t *testing.T) {
		post := entity.Post{
			AuthorID:    1,
			Title:       "Valid Post Title",
			Content:     "This is a valid content for the post.",
			Status:      "",
		}

		ok, err := govalidator.ValidateStruct(post)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).ToNot(BeNil())

		g.Expect(err.Error()).To(Equal("Status is required"))
	})
}

