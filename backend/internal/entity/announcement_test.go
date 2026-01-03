package entity_test

import (
	"testing"
	"time"

	. "github.com/onsi/gomega"
	"github.com/sut68/team12/backend/internal/entity"
)

func TestAnnouncement(t *testing.T) {
	g := NewGomegaWithT(t)

	// Validation Setup
	// Positive Case
	t.Run("should pass validation with valid data", func(t *testing.T) {
		ann := entity.Announcement{
			Title:          "System Maintenance",
			Content:        "The system will be down...",
			PublishStartAt: time.Now(),
			PublishEndAt:   time.Now().Add(24 * time.Hour),
		}
		ok, err := entity.ValidateAnnouncement(ann)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	// Negative Case 1: Missing Title
	t.Run("should fail validation when Title is missing", func(t *testing.T) {
		ann := entity.Announcement{
			Title:          "",
			Content:        "Content",
			PublishStartAt: time.Now(),
			PublishEndAt:   time.Now().Add(24 * time.Hour),
		}
		ok, err := entity.ValidateAnnouncement(ann)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).ToNot(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("Title is required"))
	})

	// Negative Case 2: Missing Content
	t.Run("should fail validation when Content is missing", func(t *testing.T) {
		ann := entity.Announcement{
			Title:          "Title",
			Content:        "",
			PublishStartAt: time.Now(),
			PublishEndAt:   time.Now().Add(24 * time.Hour),
		}
		ok, err := entity.ValidateAnnouncement(ann)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).ToNot(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("Content is required"))
	})

	// Negative Case 3: Missing PublishStartAt
	t.Run("should fail validation when PublishStartAt is missing", func(t *testing.T) {
		ann := entity.Announcement{
			Title:   "Title",
			Content: "Content",
			// PublishStartAt is zero time
			PublishEndAt: time.Now().Add(24 * time.Hour),
		}
		ok, err := entity.ValidateAnnouncement(ann)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).ToNot(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("PublishStartAt is required"))
	})
}
