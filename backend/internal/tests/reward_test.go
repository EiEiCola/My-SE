package tests

import (
	"testing"

	. "github.com/onsi/gomega"
	"github.com/sut68/team12/backend/internal/entity"
)

func TestRewardValid(t *testing.T) {
	g := NewGomegaWithT(t)

	r := entity.Reward{
		RewardName:    "Sticker Pack",
		PointRequired: 50,
		RewardPicture: "https://example.com/pic.png",
		AdminID:       1,
	}

	ok, err := entity.ValidateReward(r)
	t.Logf("ok=%v err=%v", ok, err)

	g.Expect(ok).To(BeTrue())
	g.Expect(err).To(BeNil())
}

func TestRewardMissingRewardName(t *testing.T) {
	g := NewGomegaWithT(t)

	r := entity.Reward{
		RewardName:    "",
		PointRequired: 50,
		AdminID:       1,
	}

	ok, err := entity.ValidateReward(r)
	t.Logf("ok=%v err=%v", ok, err)

	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("RewardName is required"))
}

func TestRewardPointRequiredInvalid(t *testing.T) {
	g := NewGomegaWithT(t)

	r := entity.Reward{
		RewardName:    "Sticker Pack",
		PointRequired: 0,
		AdminID:       1,
	}

	ok, err := entity.ValidateReward(r)
	t.Logf("ok=%v err=%v", ok, err)

	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("PointRequired must be greater than 0"))
}

func TestRewardMissingAdminID(t *testing.T) {
	g := NewGomegaWithT(t)

	r := entity.Reward{
		RewardName:    "Sticker Pack",
		PointRequired: 50,
		AdminID:       0,
	}

	ok, err := entity.ValidateReward(r)
	t.Logf("ok=%v err=%v", ok, err)

	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("AdminID is required"))
}
