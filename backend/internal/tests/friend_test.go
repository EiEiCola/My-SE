package tests

import (
	"testing"
	"time"

	. "github.com/onsi/gomega"
	"github.com/sut68/team12/backend/internal/entity"
)

// ทดสอบกรณีข้อมูลถูกต้อง
func TestFriendRequestValid(t *testing.T) {
	g := NewGomegaWithT(t)

	req := entity.RequesFriend{
		SentMemID:      1,
		ReceiveMemID:    2,
		RequesStatusID: 1, // 1: Pending
		CreatedAt:      time.Now(),
	}

	ok, err := entity.ValidateRequesFriend(req)
	g.Expect(ok).To(BeTrue())
	g.Expect(err).To(BeNil())
}

// ทดสอบกรณีไม่ระบุผู้ส่ง (Sender)
func TestFriendRequestSenderRequired(t *testing.T) {
	g := NewGomegaWithT(t)

	req := entity.RequesFriend{
		SentMemID:      0, // Invalid
		ReceiveMemID:    2,
		RequesStatusID: 1,
		CreatedAt:      time.Now(),
	}

	ok, err := entity.ValidateRequesFriend(req)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(ContainSubstring("Sender ID is required"))
}

// ทดสอบกรณีส่งคำขอให้ตัวเอง (Self-Request)
func TestFriendRequestCannotSendToSelf(t *testing.T) {
	g := NewGomegaWithT(t)

	req := entity.RequesFriend{
		SentMemID:      1,
		ReceiveMemID:    1, // Invalid
		RequesStatusID: 1,
		CreatedAt:      time.Now(),
	}

	ok, err := entity.ValidateRequesFriend(req)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(ContainSubstring("Cannot send request to yourself"))
}

// ทดสอบกรณีลืมใส่วันที่
func TestFriendRequestCreatedAtRequired(t *testing.T) {
	g := NewGomegaWithT(t)

	req := entity.RequesFriend{
		SentMemID:      1,
		ReceiveMemID:    2,
		RequesStatusID: 1,
		// CreatedAt missing
	}

	ok, err := entity.ValidateRequesFriend(req)
	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(ContainSubstring("CreatedAt is required"))
}

func TestBlockValidation(t *testing.T) {
    g := NewGomegaWithT(t)

    // Positive Case
    t.Run("TC-BLOCK-P-01: Valid Block Data", func(t *testing.T) {
        b := entity.Block{
            BlockerID: 1, 
            BlockedID: 2, 
            Active: true, 
            CreatedAt: time.Now(),
        }
        ok, err := entity.ValidateBlock(b)
        g.Expect(ok).To(BeTrue())
        g.Expect(err).To(BeNil())
    })

    // Negative Cases
    t.Run("TC-BLOCK-N-01: Missing Blocker ID", func(t *testing.T) {
        b := entity.Block{BlockerID: 0, BlockedID: 2}
        ok, err := entity.ValidateBlock(b)
        g.Expect(ok).To(BeFalse())
        g.Expect(err.Error()).To(ContainSubstring("Blocker ID is required"))
    })

    t.Run("TC-BLOCK-N-02: Missing Blocked ID", func(t *testing.T) {
        b := entity.Block{BlockerID: 1, BlockedID: 0}
        ok, err := entity.ValidateBlock(b)
        g.Expect(ok).To(BeFalse())
        g.Expect(err.Error()).To(ContainSubstring("Blocked ID is required"))
    })

    t.Run("TC-BLOCK-N-03: Block Self Attempt", func(t *testing.T) {
        b := entity.Block{BlockerID: 1, BlockedID: 1}
        ok, err := entity.ValidateBlock(b)
        g.Expect(ok).To(BeFalse())
        g.Expect(err.Error()).To(ContainSubstring("Cannot block yourself"))
    })
}

// ----------------- FOLLOW VALIDATION (ถูก 1 ผิด 3) -----------------
func TestFollowValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run("TC-FOLLOW-01: Valid Follow", func(t *testing.T) {
		f := entity.Follow{FollowerID: 1, FollowedID: 2, FollowStatusID: 1}
		ok, err := entity.ValidateFollow(f)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("TC-FOLLOW-02: FollowerID Missing", func(t *testing.T) {
		f := entity.Follow{FollowerID: 0, FollowedID: 2, FollowStatusID: 1}
		ok, err := entity.ValidateFollow(f)
		g.Expect(ok).To(BeFalse())
		g.Expect(err.Error()).To(ContainSubstring("Follower ID is required"))
	})

	t.Run("TC-FOLLOW-03: Follow Self", func(t *testing.T) {
		f := entity.Follow{FollowerID: 1, FollowedID: 1, FollowStatusID: 1}
		ok, err := entity.ValidateFollow(f)
		g.Expect(ok).To(BeFalse())
		g.Expect(err.Error()).To(ContainSubstring("Cannot follow yourself"))
	})

	t.Run("TC-FOLLOW-04: FollowStatusID Missing", func(t *testing.T) {
		f := entity.Follow{FollowerID: 1, FollowedID: 2, FollowStatusID: 0}
		ok, err := entity.ValidateFollow(f)
		g.Expect(ok).To(BeFalse())
		g.Expect(err.Error()).To(ContainSubstring("FollowStatus ID is required"))
	})
}

// // ----------------- RELATIONS VALIDATION (ถูก 1 ผิด 3) -----------------
func TestRelationsValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run("TC-REL-01: Valid Relations", func(t *testing.T) {
		rel := entity.Relations{Member1_ID: 1, Member2_ID: 2, CreatedAt: time.Now()}
		ok, err := entity.ValidateRelations(rel)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("TC-REL-02: Member1 Missing", func(t *testing.T) {
		rel := entity.Relations{Member1_ID: 0, Member2_ID: 2, CreatedAt: time.Now()}
		ok, err := entity.ValidateRelations(rel)
		g.Expect(ok).To(BeFalse())
		g.Expect(err.Error()).To(ContainSubstring("Member1 ID is required"))
	})

	t.Run("TC-REL-03: Relation with Self", func(t *testing.T) {
		rel := entity.Relations{Member1_ID: 5, Member2_ID: 5, CreatedAt: time.Now()}
		ok, err := entity.ValidateRelations(rel)
		g.Expect(ok).To(BeFalse())
		g.Expect(err.Error()).To(ContainSubstring("A member cannot be in a relation with themselves"))
	})

	t.Run("TC-REL-04: CreatedAt Missing", func(t *testing.T) {
		rel := entity.Relations{Member1_ID: 1, Member2_ID: 2} // No CreatedAt
		ok, err := entity.ValidateRelations(rel)
		g.Expect(ok).To(BeFalse())
		g.Expect(err.Error()).To(ContainSubstring("CreatedAt is required"))
	})
}
