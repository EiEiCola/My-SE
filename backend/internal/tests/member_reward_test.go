package tests

import (
	"testing"
	"time"

	. "github.com/onsi/gomega"
	"github.com/sut68/team12/backend/internal/entity"
)

func TestMemberRewardValid(t *testing.T) {
	g := NewGomegaWithT(t)

	mr := entity.MemberReward{
		MemberID:              1,
		RewardID:              2,
		PointUsed:             50,
		RedeemedAt:            time.Now(),
		RewardNameSnapshot:    "Sticker Pack",
		PointRequiredSnapshot: 50,
		PointTransactionID:    10,
	}

	ok, err := entity.ValidateMemberReward(mr)
	t.Logf("ok=%v err=%v", ok, err)

	g.Expect(ok).To(BeTrue())
	g.Expect(err).To(BeNil())
}

func TestMemberRewardMissingMemberID(t *testing.T) {
	g := NewGomegaWithT(t)

	mr := entity.MemberReward{
		MemberID:              0,
		RewardID:              2,
		PointUsed:             50,
		RedeemedAt:            time.Now(),
		RewardNameSnapshot:    "Sticker Pack",
		PointRequiredSnapshot: 50,
		PointTransactionID:    10,
	}

	ok, err := entity.ValidateMemberReward(mr)
	t.Logf("ok=%v err=%v", ok, err)

	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("MemberID is required"))
}

func TestMemberRewardMissingRewardID(t *testing.T) {
	g := NewGomegaWithT(t)

	mr := entity.MemberReward{
		MemberID:              1,
		RewardID:              0,
		PointUsed:             50,
		RedeemedAt:            time.Now(),
		RewardNameSnapshot:    "Sticker Pack",
		PointRequiredSnapshot: 50,
		PointTransactionID:    10,
	}

	ok, err := entity.ValidateMemberReward(mr)
	t.Logf("ok=%v err=%v", ok, err)

	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("RewardID is required"))
}

func TestMemberRewardPointUsedInvalid(t *testing.T) {
	g := NewGomegaWithT(t)

	mr := entity.MemberReward{
		MemberID:              1,
		RewardID:              2,
		PointUsed:             0,
		RedeemedAt:            time.Now(),
		RewardNameSnapshot:    "Sticker Pack",
		PointRequiredSnapshot: 50,
		PointTransactionID:    10,
	}

	ok, err := entity.ValidateMemberReward(mr)
	t.Logf("ok=%v err=%v", ok, err)

	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("PointUsed must be greater than 0"))
}

func TestMemberRewardRedeemedAtMissing(t *testing.T) {
	g := NewGomegaWithT(t)

	mr := entity.MemberReward{
		MemberID:              1,
		RewardID:              2,
		PointUsed:             50,
		RedeemedAt:            time.Time{},
		RewardNameSnapshot:    "Sticker Pack",
		PointRequiredSnapshot: 50,
		PointTransactionID:    10,
	}

	ok, err := entity.ValidateMemberReward(mr)
	t.Logf("ok=%v err=%v", ok, err)

	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("RedeemedAt is required"))
}

func TestMemberRewardMissingRewardNameSnapshot(t *testing.T) {
	g := NewGomegaWithT(t)

	mr := entity.MemberReward{
		MemberID:              1,
		RewardID:              2,
		PointUsed:             50,
		RedeemedAt:            time.Now(),
		RewardNameSnapshot:    "",
		PointRequiredSnapshot: 50,
		PointTransactionID:    10,
	}

	ok, err := entity.ValidateMemberReward(mr)
	t.Logf("ok=%v err=%v", ok, err)

	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("RewardNameSnapshot is required"))
}

func TestMemberRewardPointRequiredSnapshotInvalid(t *testing.T) {
	g := NewGomegaWithT(t)

	mr := entity.MemberReward{
		MemberID:              1,
		RewardID:              2,
		PointUsed:             50,
		RedeemedAt:            time.Now(),
		RewardNameSnapshot:    "Sticker Pack",
		PointRequiredSnapshot: 0,
		PointTransactionID:    10,
	}

	ok, err := entity.ValidateMemberReward(mr)
	t.Logf("ok=%v err=%v", ok, err)

	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("PointRequiredSnapshot must be greater than 0"))
}

func TestMemberRewardPointUsedNotEqualSnapshot(t *testing.T) {
	g := NewGomegaWithT(t)

	mr := entity.MemberReward{
		MemberID:              1,
		RewardID:              2,
		PointUsed:             40,
		RedeemedAt:            time.Now(),
		RewardNameSnapshot:    "Sticker Pack",
		PointRequiredSnapshot: 50,
		PointTransactionID:    10,
	}

	ok, err := entity.ValidateMemberReward(mr)
	t.Logf("ok=%v err=%v", ok, err)

	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("PointUsed must equal PointRequiredSnapshot"))
}

func TestMemberRewardMissingPointTransactionID(t *testing.T) {
	g := NewGomegaWithT(t)

	mr := entity.MemberReward{
		MemberID:              1,
		RewardID:              2,
		PointUsed:             50,
		RedeemedAt:            time.Now(),
		RewardNameSnapshot:    "Sticker Pack",
		PointRequiredSnapshot: 50,
		PointTransactionID:    0,
	}

	ok, err := entity.ValidateMemberReward(mr)
	t.Logf("ok=%v err=%v", ok, err)

	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("PointTransactionID is required"))
}
