package tests

import (
	"testing"

	. "github.com/onsi/gomega"
	"github.com/sut68/team12/backend/internal/entity"
)

func TestPointTransactionEarnValid(t *testing.T) {
	g := NewGomegaWithT(t)

	ruleID := uint(1)
	tx := entity.PointTransaction{
		MemberID:    1,
		PointRuleID: &ruleID,
		PointChange: 10,
		TxnType:     entity.PointTxnEarn,
		SourceType:  "post",
		SourceID:    99,
	}

	ok, err := entity.ValidatePointTransaction(tx)

	g.Expect(ok).To(BeTrue())
	g.Expect(err).To(BeNil())
}

func TestPointTransactionMissingMemberID(t *testing.T) {
	g := NewGomegaWithT(t)

	ruleID := uint(1)
	tx := entity.PointTransaction{
		MemberID:    0,
		PointRuleID: &ruleID,
		PointChange: 10,
		TxnType:     entity.PointTxnEarn,
		SourceType:  "post",
		SourceID:    99,
	}

	ok, err := entity.ValidatePointTransaction(tx)

	g.Expect(ok).To(BeFalse())
	g.Expect(err.Error()).To(Equal("MemberID is required"))
}

func TestPointTransactionInvalidTxnType(t *testing.T) {
	g := NewGomegaWithT(t)

	tx := entity.PointTransaction{
		MemberID:    1,
		PointChange: 10,
		TxnType:     "XXX",
		SourceType:  "post",
		SourceID:    99,
	}

	ok, err := entity.ValidatePointTransaction(tx)

	g.Expect(ok).To(BeFalse())
	g.Expect(err.Error()).To(Equal("TxnType is invalid"))
}

func TestPointTransactionMissingSourceType(t *testing.T) {
	g := NewGomegaWithT(t)

	ruleID := uint(1)
	tx := entity.PointTransaction{
		MemberID:    1,
		PointRuleID: &ruleID,
		PointChange: 10,
		TxnType:     entity.PointTxnEarn,
		SourceType:  "",
		SourceID:    99,
	}

	ok, err := entity.ValidatePointTransaction(tx)

	g.Expect(ok).To(BeFalse())
	g.Expect(err.Error()).To(Equal("SourceType is required"))
}

func TestPointTransactionMissingSourceID(t *testing.T) {
	g := NewGomegaWithT(t)

	ruleID := uint(1)
	tx := entity.PointTransaction{
		MemberID:    1,
		PointRuleID: &ruleID,
		PointChange: 10,
		TxnType:     entity.PointTxnEarn,
		SourceType:  "post",
		SourceID:    0,
	}

	ok, err := entity.ValidatePointTransaction(tx)

	g.Expect(ok).To(BeFalse())
	g.Expect(err.Error()).To(Equal("SourceID is required"))
}

func TestPointTransactionEarnMissingPointRuleID(t *testing.T) {
	g := NewGomegaWithT(t)

	tx := entity.PointTransaction{
		MemberID:    1,
		PointChange: 10,
		TxnType:     entity.PointTxnEarn,
		SourceType:  "post",
		SourceID:    99,
	}

	ok, err := entity.ValidatePointTransaction(tx)

	g.Expect(ok).To(BeFalse())
	g.Expect(err.Error()).To(Equal("PointRuleID is required for EARN"))
}

func TestPointTransactionEarnPointChangeNotPositive(t *testing.T) {
	g := NewGomegaWithT(t)

	ruleID := uint(1)
	tx := entity.PointTransaction{
		MemberID:    1,
		PointRuleID: &ruleID,
		PointChange: 0,
		TxnType:     entity.PointTxnEarn,
		SourceType:  "post",
		SourceID:    99,
	}

	ok, err := entity.ValidatePointTransaction(tx)

	g.Expect(ok).To(BeFalse())
	g.Expect(err.Error()).To(Equal("PointChange must be greater than 0 for EARN"))
}

func TestPointTransactionSpendPointRuleMustBeNil(t *testing.T) {
	g := NewGomegaWithT(t)

	ruleID := uint(1)
	tx := entity.PointTransaction{
		MemberID:    1,
		PointRuleID: &ruleID,
		PointChange: -20,
		TxnType:     entity.PointTxnSpend,
		SourceType:  "redeem",
		SourceID:    123,
	}

	ok, err := entity.ValidatePointTransaction(tx)

	g.Expect(ok).To(BeFalse())
	g.Expect(err.Error()).To(Equal("PointRuleID must be nil for SPEND"))
}

func TestPointTransactionSpendPointChangeNotNegative(t *testing.T) {
	g := NewGomegaWithT(t)

	tx := entity.PointTransaction{
		MemberID:    1,
		PointChange: 20,
		TxnType:     entity.PointTxnSpend,
		SourceType:  "redeem",
		SourceID:    123,
	}

	ok, err := entity.ValidatePointTransaction(tx)

	g.Expect(ok).To(BeFalse())
	g.Expect(err.Error()).To(Equal("PointChange must be less than 0 for SPEND"))
}
