package tests

import (
	"testing"

	. "github.com/onsi/gomega"
	"github.com/sut68/team12/backend/internal/entity"
)

func TestMemberAccountValid(t *testing.T) {
	g := NewGomegaWithT(t)

	a := entity.MemberAccount{
		Email:    "john@example.com",
		Password: "password123",
		RoleID:   1,
		MemberID: 1,
	}

	ok, err := entity.ValidateMemberAccount(a)
	t.Logf("ok=%v err=%v", ok, err)

	g.Expect(ok).To(BeTrue())
	g.Expect(err).To(BeNil())
}

func TestMemberAccountPasswordTooShort(t *testing.T) {
	g := NewGomegaWithT(t)

	a := entity.MemberAccount{
		Email:    "john@example.com",
		Password: "1234567",
		RoleID:   1,
		MemberID: 1,
	}

	ok, err := entity.ValidateMemberAccount(a)
	t.Logf("ok=%v err=%v", ok, err)

	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("Password must be at least 8 characters"))
}
