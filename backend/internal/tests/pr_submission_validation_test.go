package tests

import (
	"testing"
	"time"

	. "github.com/onsi/gomega"
	"github.com/sut68/team12/backend/internal/entity"
)

func TestPRSubmissionValid(t *testing.T) {
	g := NewGomegaWithT(t)

	p := entity.PRSubmission{
		MemberID:   1,
		Title:      "Valid Title",
		Content:    "Valid Content",
		ReqStartAt: time.Now(),
		ReqEndAt:   time.Now().Add(24 * time.Hour),
	}

	ok, err := entity.ValidatePRSubmission(p)
	g.Expect(ok).To(BeTrue())
	g.Expect(err).To(BeNil())
}

func TestPRSubmissionTitleRequired(t *testing.T) {
	g := NewGomegaWithT(t)

	p := entity.PRSubmission{
		MemberID:   1,
		Title:      "", // Invalid
		Content:    "Valid Content",
		ReqStartAt: time.Now(),
		ReqEndAt:   time.Now().Add(24 * time.Hour),
	}

	ok, err := entity.ValidatePRSubmission(p)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(ContainSubstring("Title is required"))
}

func TestPRSubmissionContentRequired(t *testing.T) {
	g := NewGomegaWithT(t)

	p := entity.PRSubmission{
		MemberID:   1,
		Title:      "Valid Title",
		Content:    "", // Invalid
		ReqStartAt: time.Now(),
		ReqEndAt:   time.Now().Add(24 * time.Hour),
	}

	ok, err := entity.ValidatePRSubmission(p)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(ContainSubstring("Content is required"))
}

func TestPRSubmissionDatesRequired(t *testing.T) {
	g := NewGomegaWithT(t)

	p := entity.PRSubmission{
		MemberID: 1,
		Title:    "Valid Title",
		Content:  "Valid Content",
		// Missing dates (ReqStartAt/ReqEndAt zero value)
	}

	ok, err := entity.ValidatePRSubmission(p)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(ContainSubstring("ReqStartAt is required"))
	g.Expect(err.Error()).To(ContainSubstring("ReqEndAt is required"))
}
