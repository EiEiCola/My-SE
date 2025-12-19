package tests

import (
	"testing"

	. "github.com/onsi/gomega"
	"github.com/asaskevich/govalidator"
	"github.com/sut68/team12/backend/internal/entity"
)

func TestMemberAccountValid(t *testing.T) {
	g := NewGomegaWithT(t)

	a := entity.MemberAccount{
		Email:        "john@example.com",
		PasswordHash: "$2a$10$mockedhashvalue", // mock hash (validator ไม่เช็ค field นี้)
		RoleID:       1,
	}

	ok, err := govalidator.ValidateStruct(a)
	t.Logf("ok=%v err=%v", ok, err)

	g.Expect(ok).To(BeTrue())
	g.Expect(err).To(BeNil())
}

func TestMemberAccountInvalidEmail(t *testing.T) {
	g := NewGomegaWithT(t)

	a := entity.MemberAccount{
		Email:        "not-an-email",
		PasswordHash: "$2a$10$mockedhashvalue",
		RoleID:       1,
	}

	ok, err := govalidator.ValidateStruct(a)
	t.Logf("ok=%v err=%v", ok, err)

	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	// govalidator จะคืน message ตาม tag: "Email is invalid"
	g.Expect(err.Error()).To(ContainSubstring("Email is invalid"))
}

func TestMemberAccountMissingRoleID(t *testing.T) {
	g := NewGomegaWithT(t)

	a := entity.MemberAccount{
		Email:        "john@example.com",
		PasswordHash: "$2a$10$mockedhashvalue",
		RoleID:       0, // required
	}

	ok, err := govalidator.ValidateStruct(a)
	t.Logf("ok=%v err=%v", ok, err)

	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(ContainSubstring("RoleID is required"))
}

func TestValidateAccountRegisterInputValid(t *testing.T) {
	g := NewGomegaWithT(t)

	ok, err := entity.ValidateAccountRegisterInput("john@example.com", "password123", 1)
	t.Logf("ok=%v err=%v", ok, err)

	g.Expect(ok).To(BeTrue())
	g.Expect(err).To(BeNil())
}

func TestValidateAccountRegisterInputPasswordTooShort(t *testing.T) {
	g := NewGomegaWithT(t)

	ok, err := entity.ValidateAccountRegisterInput("john@example.com", "1234567", 1)
	t.Logf("ok=%v err=%v", ok, err)

	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("Password must be at least 8 characters"))
}

func TestValidateAccountRegisterInputMissingRoleID(t *testing.T) {
	g := NewGomegaWithT(t)

	ok, err := entity.ValidateAccountRegisterInput("john@example.com", "password123", 0)
	t.Logf("ok=%v err=%v", ok, err)

	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("RoleID is required"))
}

func TestValidateAccountRegisterInputMissingEmail(t *testing.T) {
	g := NewGomegaWithT(t)

	ok, err := entity.ValidateAccountRegisterInput("   ", "password123", 1)
	t.Logf("ok=%v err=%v", ok, err)

	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("Email is required"))
}
