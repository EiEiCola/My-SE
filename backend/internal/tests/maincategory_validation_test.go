package tests

import (
	"testing"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/sut68/team12/backend/internal/entity"
)

func TestMainCategoryValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run(`Is completely valid`, func(t *testing.T) {
		mainCat := entity.MainCategory{
			Title:       "Technology",
			Description: "This is a valid description.",
			Icon:        "Book",
			OrderIndex:  1,
		}

		ok, err := govalidator.ValidateStruct(mainCat)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})
}

func TestTitleRequiredValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run(`Title is required`, func(t *testing.T) {
		mainCat := entity.MainCategory{
			Title:	     "",
			Description: "This is a valid description.",
			Icon:        "Book",
			OrderIndex:  1,
		}

		ok, err := govalidator.ValidateStruct(mainCat)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).ToNot(BeNil())
	
		g.Expect(err.Error()).To(Equal("Title is required"))
	})
}

func TestTitleLengthValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run(`Title length less than 2 characters`, func(t *testing.T) {
		mainCat := entity.MainCategory{
			Title:       "T",
			Description: "This is a valid description.",
			Icon:        "Book",
			OrderIndex:  1,
		}

		ok, err := govalidator.ValidateStruct(mainCat)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).ToNot(BeNil())

		g.Expect(err.Error()).To(Equal("Title must be between 2 and 60 characters"))
	})

	t.Run(`Title length more than 60 characters`, func(t *testing.T) {
		mainCat := entity.MainCategory{
			Title:       "This title is way too long to be considered valid for a main category",
			Description: "This is a valid description.",
			Icon:        "Book",
			OrderIndex:  1,
		}

		ok, err := govalidator.ValidateStruct(mainCat)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).ToNot(BeNil())

		g.Expect(err.Error()).To(Equal("Title must be between 2 and 60 characters"))
	})
}

func TestDescriptionRequiredValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run(`Description is required`, func(t *testing.T) {
		mainCat := entity.MainCategory{
			Title:       "Technology",
			Description: "",
			Icon:        "Book",
			OrderIndex:  1,
		}

		ok, err := govalidator.ValidateStruct(mainCat)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).ToNot(BeNil())

		g.Expect(err.Error()).To(Equal("Description is required"))
	})
}

func TestDescriptionLengthValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run(`Description length more than 300 characters`, func(t *testing.T) {
		longDescription := ""
		for i := 0; i < 301; i++ {
			longDescription += "a"
		}
		mainCat := entity.MainCategory{
			Title:       "Technology",
			Description: longDescription,
			Icon:        "Book",
			OrderIndex:  1,
		}

		ok, err := govalidator.ValidateStruct(mainCat)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).ToNot(BeNil())

		g.Expect(err.Error()).To(Equal("Description must not exceed 300 characters"))
	})
}

func TestOrderIndexValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run(`Order index is negative`, func(t *testing.T) {
		mainCat := entity.MainCategory{
			Title:       "Technology",
			Description: "This is a valid description.",
			Icon:        "Book",
			OrderIndex:  -1,
		}

		ok, err := govalidator.ValidateStruct(mainCat)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).ToNot(BeNil())

		g.Expect(err.Error()).To(Equal("Order index must be >= 0"))
	})
}

func TestIconRequiredValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run(`Icon is required`, func(t *testing.T) {
		mainCat := entity.MainCategory{
			Title:       "Technology",
			Description: "This is a valid description.",
			Icon:        "",
			OrderIndex:  1,
		}

		ok, err := govalidator.ValidateStruct(mainCat)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).ToNot(BeNil())	

		g.Expect(err.Error()).To(Equal("Icon is required"))
	})
}

func TestIconAllowedValuesValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run(`Icon has an invalid value`, func(t *testing.T) {
		mainCat := entity.MainCategory{
			Title:       "Technology",
			Description: "This is a valid description.",
			Icon:        "Computer",
			OrderIndex:  1,
		}

		ok, err := govalidator.ValidateStruct(mainCat)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).ToNot(BeNil())	

		g.Expect(err.Error()).To(Equal("Icon must be one of the allowed values"))
	})
}