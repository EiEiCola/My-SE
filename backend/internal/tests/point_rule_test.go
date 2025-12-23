package tests

import (
	"testing"

	. "github.com/onsi/gomega"
	"github.com/sut68/team12/backend/internal/entity"
)

func TestPointRuleValid(t *testing.T) {
	g := NewGomegaWithT(t)

	pr := entity.PointRule{
		ActivityType:  "post",
		ActivityPoint: 10,
		DailyLimit:    5,
	}

	ok, err := entity.ValidatePointRule(pr)
	t.Logf("ok=%v err=%v", ok, err)

	g.Expect(ok).To(BeTrue())
	g.Expect(err).To(BeNil())
}

func TestPointRuleMissingActivityType(t *testing.T) {
	g := NewGomegaWithT(t)

	pr := entity.PointRule{
		ActivityType:  "",
		ActivityPoint: 10,
		DailyLimit:    5,
	}

	ok, err := entity.ValidatePointRule(pr)
	t.Logf("ok=%v err=%v", ok, err)

	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("ActivityType is required"))
}

func TestPointRuleInvalidActivityPoint(t *testing.T) {
	g := NewGomegaWithT(t)

	pr := entity.PointRule{
		ActivityType:  "review",
		ActivityPoint: 0,
		DailyLimit:    5,
	}

	ok, err := entity.ValidatePointRule(pr)
	t.Logf("ok=%v err=%v", ok, err)

	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("ActivityPoint must be greater than 0"))
}

func TestPointRuleNegativeDailyLimit(t *testing.T) {
	g := NewGomegaWithT(t)

	pr := entity.PointRule{
		ActivityType:  "poll",
		ActivityPoint: 5,
		DailyLimit:    -1,
	}

	ok, err := entity.ValidatePointRule(pr)
	t.Logf("ok=%v err=%v", ok, err)

	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("DailyLimit must be zero or positive"))
}
