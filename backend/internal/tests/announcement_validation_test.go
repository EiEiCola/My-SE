package tests

import (
	"testing"
	"time"

	. "github.com/onsi/gomega"
	"github.com/sut68/team12/backend/internal/entity"
)

func TestAnnouncementValid(t *testing.T) {
	g := NewGomegaWithT(t)

	a := entity.Announcement{
		Title:          "Valid Title",
		Content:        "Valid Content",
		PublishStartAt: time.Now(),
		PublishEndAt:   time.Now().Add(24 * time.Hour),
	}

	ok, err := entity.ValidateAnnouncement(a)
	g.Expect(ok).To(BeTrue())
	g.Expect(err).To(BeNil())
}

func TestAnnouncementTitleRequired(t *testing.T) {
	g := NewGomegaWithT(t)

	a := entity.Announcement{
		Title:          "", // Invalid
		Content:        "Valid Content",
		PublishStartAt: time.Now(),
		PublishEndAt:   time.Now().Add(24 * time.Hour),
	}

	ok, err := entity.ValidateAnnouncement(a)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(ContainSubstring("Title is required"))
}

func TestAnnouncementContentRequired(t *testing.T) {
	g := NewGomegaWithT(t)

	a := entity.Announcement{
		Title:          "Valid Title",
		Content:        "", // Invalid
		PublishStartAt: time.Now(),
		PublishEndAt:   time.Now().Add(24 * time.Hour),
	}

	ok, err := entity.ValidateAnnouncement(a)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(ContainSubstring("Content is required"))
}

func TestAnnouncementDatesRequired(t *testing.T) {
	g := NewGomegaWithT(t)

	a := entity.Announcement{
		Title:   "Valid Title",
		Content: "Valid Content",
		// Missing dates
	}

	ok, err := entity.ValidateAnnouncement(a)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(ContainSubstring("PublishStartAt is required"))
	g.Expect(err.Error()).To(ContainSubstring("PublishEndAt is required"))
}
