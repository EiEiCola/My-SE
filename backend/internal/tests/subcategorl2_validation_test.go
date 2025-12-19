package tests

import (

	"testing"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/sut68/team12/backend/internal/entity"
)

func TestSubcategoryL2Validation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run(`Is completely valid`, func(t *testing.T) {
		subCat2 := entity.SubCategoryL2{
			Title:       "Machine Learning",
			Description: "This is a valid description for subcategory L2.",
			OrderIndex:  1,
		}

		ok, err := govalidator.ValidateStruct(subCat2)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})
}

func TestSubL2TitleIsRequired(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run(`Title is required`, func(t *testing.T) {
		subCat2 := entity.SubCategoryL2{
			Title:       "",
			Description: "This is a valid description for subcategory L2.",
			OrderIndex:  1,
		}

		ok, err := govalidator.ValidateStruct(subCat2)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).ToNot(BeNil())

		g.Expect(err.Error()).To(Equal("Title is required"))
	})
}

func TestSubL2TitleLengthValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run(`Title length less than 2 characters`, func(t *testing.T) {
		subCat2 := entity.SubCategoryL2{
			Title:       "M",
			Description: "This is a valid description for subcategory L2.",
			OrderIndex:  1,
		}

		ok, err := govalidator.ValidateStruct(subCat2)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).ToNot(BeNil())

		g.Expect(err.Error()).To(Equal("Title must be between 2 and 60 characters"))
	})

	t.Run(`Title length more than 60 characters`, func(t *testing.T) {
		subCat2 := entity.SubCategoryL2{
			Title:       "This title is way too long to be considered valid for a subcategory L2",
			Description: "This is a valid description for subcategory L2.",
			OrderIndex:  1,
		}

		ok, err := govalidator.ValidateStruct(subCat2)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).ToNot(BeNil())

		g.Expect(err.Error()).To(Equal("Title must be between 2 and 60 characters"))
	})
}

func TestSubL2DescriptionIsRequired(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run(`Description is required`, func(t *testing.T) {
		subCat2 := entity.SubCategoryL2{
			Title:       "Machine Learning",
			Description: "",
			OrderIndex:  1,
		}

		ok, err := govalidator.ValidateStruct(subCat2)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).ToNot(BeNil())

		g.Expect(err.Error()).To(Equal("Description is required"))
	})
}

func TestSubL2DescriptionLengthValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run(`Description length more than 300 characters`, func(t *testing.T) {
		longDescription := ""
		for i := 0; i < 310; i++ {
			longDescription += "a"
		}
		subCat2 := entity.SubCategoryL2{
			Title:       "Machine Learning",
			Description: longDescription,
			OrderIndex:  1,
		}

		ok, err := govalidator.ValidateStruct(subCat2)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).ToNot(BeNil())

		g.Expect(err.Error()).To(Equal("Description must not exceed 300 characters"))
	})
}

func TestSubL2OrderIndexValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run(`OrderIndex is negative`, func(t *testing.T) {
		subCat2 := entity.SubCategoryL2{
			Title:       "Machine Learning",
			Description: "This is a valid description for subcategory L2.",
			OrderIndex:  -1,
		}

		ok, err := govalidator.ValidateStruct(subCat2)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).ToNot(BeNil())

		g.Expect(err.Error()).To(Equal("Order index must be >= 0"))
	})
}