package tests

import (
	"testing"

	. "github.com/onsi/gomega"
	"github.com/sut68/team12/backend/internal/entity"
)

func TestAdminValid(t *testing.T) {
	g := NewGomegaWithT(t)

	a := entity.Admin{
		Username:        "admin01",
		NationalIDHash:  "hashed_value",
		NationalIDLast4: "1234",
		FirstName:       "John",
		LastName:        "Doe",
		PhoneNumber:     "0999999999",
		MemberAccountID: 1,
	}

	ok, err := entity.ValidateAdmin(a)
	t.Logf("ok=%v err=%v", ok, err)

	g.Expect(ok).To(BeTrue())
	g.Expect(err).To(BeNil())
}

func TestAdminMissingUsername(t *testing.T) {
	g := NewGomegaWithT(t)

	a := entity.Admin{
		Username:        "",
		NationalIDHash:  "hashed_value",
		MemberAccountID: 1,
	}

	ok, err := entity.ValidateAdmin(a)
	t.Logf("ok=%v err=%v", ok, err)

	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("Username is required"))
}

func TestAdminMissingNationalIDHash(t *testing.T) {
	g := NewGomegaWithT(t)

	a := entity.Admin{
		Username:        "admin01",
		NationalIDHash:  "",
		MemberAccountID: 1,
	}

	ok, err := entity.ValidateAdmin(a)
	t.Logf("ok=%v err=%v", ok, err)

	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("NationalIDHash is required"))
}

func TestAdminNationalIDLast4InvalidLength(t *testing.T) {
	g := NewGomegaWithT(t)

	a := entity.Admin{
		Username:        "admin01",
		NationalIDHash:  "hashed_value",
		NationalIDLast4: "123", // ต้อง 4 ตัว
		MemberAccountID: 1,
	}

	ok, err := entity.ValidateAdmin(a)
	t.Logf("ok=%v err=%v", ok, err)

	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("NationalIDLast4 must be 4 characters"))
}

func TestAdminMissingMemberAccountID(t *testing.T) {
	g := NewGomegaWithT(t)

	a := entity.Admin{
		Username:       "admin01",
		NationalIDHash: "hashed_value",
		MemberAccountID: 0,
	}

	ok, err := entity.ValidateAdmin(a)
	t.Logf("ok=%v err=%v", ok, err)

	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("MemberAccountID is required"))
}
