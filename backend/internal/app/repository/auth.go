package repository

import (
	"strings"

	"github.com/sut68/team12/backend/internal/entity"
	"gorm.io/gorm"
)

type AuthRepository interface {
	FindAccountByEmail(email string) (*entity.MemberAccount, error)
	FindAccountByIdentifier(identifier string) (*entity.MemberAccount, error) // ✅ email หรือ student_id

	// ✅ สมัคร: เช็คซ้ำ
	FindMemberByStudentID(studentID string) (*entity.Member, error)
	FindMemberByNationalID(nationalID string) (*entity.Member, error)

	// ✅ forgot password: verify ด้วย identifier + national_id
	FindAccountByIdentifierAndNationalID(identifier string, nationalID string) (*entity.MemberAccount, error)

	CreateAccount(tx *gorm.DB, a *entity.MemberAccount) error
	CreateMember(tx *gorm.DB, m *entity.Member) error
}

type authRepo struct{ db *gorm.DB }

func NewAuthRepository(db *gorm.DB) AuthRepository {
	return &authRepo{db: db}
}

func (r *authRepo) FindAccountByEmail(email string) (*entity.MemberAccount, error) {
	email = strings.TrimSpace(email)

	var a entity.MemberAccount
	if err := r.db.Where("email = ?", email).First(&a).Error; err != nil {
		return nil, err
	}
	return &a, nil
}

// ✅ Login ด้วย email หรือ student_id
func (r *authRepo) FindAccountByIdentifier(identifier string) (*entity.MemberAccount, error) {
	identifier = strings.TrimSpace(identifier)

	// case email
	if strings.Contains(identifier, "@") {
		return r.FindAccountByEmail(identifier)
	}

	// case student_id -> join members
	var a entity.MemberAccount
	err := r.db.Table("member_accounts ma").
		Select("ma.*").
		Joins("JOIN members m ON m.member_account_id = ma.id").
		Where("m.student_id = ?", identifier).
		First(&a).Error
	if err != nil {
		return nil, err
	}
	return &a, nil
}

// ✅ เช็คซ้ำ student_id ก่อนสมัคร
func (r *authRepo) FindMemberByStudentID(studentID string) (*entity.Member, error) {
	studentID = strings.TrimSpace(studentID)

	var m entity.Member
	if err := r.db.Where("student_id = ?", studentID).First(&m).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

// ✅ เช็คซ้ำ national_id ก่อนสมัคร
func (r *authRepo) FindMemberByNationalID(nationalID string) (*entity.Member, error) {
	nationalID = strings.TrimSpace(nationalID)

	var m entity.Member
	if err := r.db.Where("national_id = ?", nationalID).First(&m).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

// ✅ forgot password: verify identifier + national_id (ต้อง match ทั้งคู่)
func (r *authRepo) FindAccountByIdentifierAndNationalID(identifier string, nationalID string) (*entity.MemberAccount, error) {
	identifier = strings.TrimSpace(identifier)
	nationalID = strings.TrimSpace(nationalID)

	q := r.db.Table("member_accounts ma").
		Select("ma.*").
		Joins("JOIN members m ON m.member_account_id = ma.id").
		Where("m.national_id = ?", nationalID)

	if strings.Contains(identifier, "@") {
		q = q.Where("ma.email = ?", identifier)
	} else {
		q = q.Where("m.student_id = ?", identifier)
	}

	var a entity.MemberAccount
	if err := q.First(&a).Error; err != nil {
		return nil, err
	}
	return &a, nil
}

func (r *authRepo) CreateAccount(tx *gorm.DB, a *entity.MemberAccount) error {
	return tx.Create(a).Error
}

func (r *authRepo) CreateMember(tx *gorm.DB, m *entity.Member) error {
	return tx.Create(m).Error
}
