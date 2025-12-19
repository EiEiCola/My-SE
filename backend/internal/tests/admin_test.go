package tests

import (
	"testing"

	. "github.com/onsi/gomega"
	"github.com/sut68/team12/backend/internal/entity"
)

func TestAdminValid(t *testing.T) {
	g := NewGomegaWithT(t)

	a := entity.Admin{
		Username:        "admin1",
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
		Username:        "   ",
		MemberAccountID: 1,
	}

	ok, err := entity.ValidateAdmin(a)
	t.Logf("ok=%v err=%v", ok, err)

	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("Username is required"))
}

func TestAdminMissingAccountID(t *testing.T) {
	g := NewGomegaWithT(t)

	a := entity.Admin{
		Username:        "admin1",
		MemberAccountID: 0,
	}

	ok, err := entity.ValidateAdmin(a)
	t.Logf("ok=%v err=%v", ok, err)

	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())

	// ✅ ให้ตรงกับ ValidateAdmin() ใน entity ตอนนี้
	g.Expect(err.Error()).To(Equal("MemberAccountID is required"))
}
