package tests

import (
	"testing"

	. "github.com/onsi/gomega"
	"github.com/sut68/team12/backend/internal/entity"
)

func TestMemberPointBalanceValid(t *testing.T) {
	g := NewGomegaWithT(t)

	b := entity.MemberPointBalance{
		MemberID:   1,
		TotalPoint: 100,
	}

	ok, err := entity.ValidateMemberPointBalance(b)
	t.Logf("ok=%v err=%v", ok, err)

	g.Expect(ok).To(BeTrue())
	g.Expect(err).To(BeNil())
}

func TestMemberPointBalanceZeroPoint(t *testing.T) {
	g := NewGomegaWithT(t)

	b := entity.MemberPointBalance{
		MemberID:   1,
		TotalPoint: 0,
	}

	ok, err := entity.ValidateMemberPointBalance(b)
	t.Logf("ok=%v err=%v", ok, err)

	g.Expect(ok).To(BeTrue())
	g.Expect(err).To(BeNil())
}

func TestMemberPointBalanceMissingMemberID(t *testing.T) {
	g := NewGomegaWithT(t)

	b := entity.MemberPointBalance{
		MemberID:   0,
		TotalPoint: 50,
	}

	ok, err := entity.ValidateMemberPointBalance(b)
	t.Logf("ok=%v err=%v", ok, err)

	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("MemberID is required"))
}

func TestMemberPointBalanceNegativeTotalPoint(t *testing.T) {
	g := NewGomegaWithT(t)

	b := entity.MemberPointBalance{
		MemberID:   1,
		TotalPoint: -10,
	}

	ok, err := entity.ValidateMemberPointBalance(b)
	t.Logf("ok=%v err=%v", ok, err)

	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("TotalPoint must be zero or positive"))
}
