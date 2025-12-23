package tests

import (
	"testing"
	"time"

	. "github.com/onsi/gomega"
	"github.com/sut68/team12/backend/internal/entity"
)

func TestMemberValid(t *testing.T) {
	g := NewGomegaWithT(t)

	m := entity.Member{
		FirstName:      "John",
		LastName:       "Doe",
		Username:       "john_doe",
		Dob:            time.Date(2000, 1, 1, 0, 0, 0, 0, time.UTC),
		NationalID:     "1234567890123",
		StudentID:      "B6500001",
		GenderID:       1,
		ActiveStatusID: 1,
	}

	ok, err := entity.ValidateMember(m)

	g.Expect(ok).To(BeTrue())
	g.Expect(err).To(BeNil())
}

func TestMemberFirstNameRequired(t *testing.T) {
	g := NewGomegaWithT(t)

	m := entity.Member{
		FirstName:      "",
		LastName:       "Doe",
		Username:       "john_doe",
		Dob:            time.Now(),
		NationalID:     "1234567890123",
		StudentID:      "B6500001",
		GenderID:       1,
		ActiveStatusID: 1,
	}

	ok, err := entity.ValidateMember(m)

	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("FirstName is required"))
}

func TestMemberNationalIDLength(t *testing.T) {
	g := NewGomegaWithT(t)

	m := entity.Member{
		FirstName:      "John",
		LastName:       "Doe",
		Username:       "john_doe",
		Dob:            time.Now(),
		NationalID:     "1234", // ❌ สั้นไป
		StudentID:      "B6500001",
		GenderID:       1,
		ActiveStatusID: 1,
	}

	ok, err := entity.ValidateMember(m)

	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("NationalID must be 13 digits"))
}

func TestMemberDobRequired(t *testing.T) {
	g := NewGomegaWithT(t)

	m := entity.Member{
		FirstName:      "John",
		LastName:       "Doe",
		Username:       "john_doe",
		Dob:            time.Time{}, // ❌ zero time
		NationalID:     "1234567890123",
		StudentID:      "B6500001",
		GenderID:       1,
		ActiveStatusID: 1,
	}

	ok, err := entity.ValidateMember(m)

	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("Dob is required"))
}
