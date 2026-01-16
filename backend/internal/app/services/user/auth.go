package services

import (
	"errors"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/dto"
	"github.com/sut68/team12/backend/internal/entity"
	"github.com/sut68/team12/backend/internal/utils"
	"gorm.io/gorm"
)

type AuthService interface {
	Register(req dto.RegisterReq) (uint, error)
	Login(req dto.LoginReq) (string, error)

	// forgot password
	VerifyResetIdentity(identifier string, nationalID string) (string, error)
	ResetPassword(resetToken string, newPassword string) error
}

type authSvc struct {
	db   *gorm.DB
	repo repository.AuthRepository
}

func NewAuthService(db *gorm.DB, repo repository.AuthRepository) AuthService {
	return &authSvc{db: db, repo: repo}
}

// -------------------- helpers --------------------

func getInitialPointsFromEnv() int {
	raw := strings.TrimSpace(os.Getenv("INITIAL_POINTS"))
	if raw == "" {
		return 0
	}
	n, err := strconv.Atoi(raw)
	if err != nil || n < 0 {
		return 0
	}
	return n
}

// -------------------- register --------------------

func (s *authSvc) Register(req dto.RegisterReq) (uint, error) {
	_, err := s.repo.FindAccountByEmail(req.Email)
	if err == nil {
		return 0, errors.New("EMAIL_DUP")
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return 0, err
	}

	_, err = s.repo.FindMemberByStudentID(req.StudentID)
	if err == nil {
		return 0, errors.New("STUDENT_ID_DUP")
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return 0, err
	}

	_, err = s.repo.FindMemberByNationalID(req.NationalID)
	if err == nil {
		return 0, errors.New("NATIONAL_ID_DUP")
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return 0, err
	}

	hash, err := utils.HashPassword(req.Password)
	if err != nil {
		return 0, err
	}

	var dob time.Time
	dob, err = time.Parse(time.RFC3339, req.Dob)
	if err != nil {
		dob, err = time.Parse("2006-01-02", req.Dob)
		if err != nil {
			return 0, errors.New("dob must be YYYY-MM-DD or RFC3339")
		}
	}

	const memberRoleID uint = 2
	const activeStatusID uint = 1

	tx := s.db.Begin()
	if tx.Error != nil {
		return 0, tx.Error
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	acc := entity.MemberAccount{
		Email:        req.Email,
		PasswordHash: hash,
		RoleID:       memberRoleID,
	}

	if err := s.repo.CreateAccount(tx, &acc); err != nil {
		tx.Rollback()
		if errors.Is(err, gorm.ErrDuplicatedKey) {
			return 0, errors.New("EMAIL_DUP")
		}
		return 0, err
	}

	member := entity.Member{
		FirstName:       req.FirstName,
		LastName:        req.LastName,
		Username:        req.Username,
		Dob:             dob,
		NationalID:      req.NationalID,
		StudentID:       req.StudentID,
		GenderID:        req.GenderID,
		ActiveStatusID:  activeStatusID,
		MemberAccountID: acc.ID,
	}

	if err := s.repo.CreateMember(tx, &member); err != nil {
		tx.Rollback()
		if errors.Is(err, gorm.ErrDuplicatedKey) {
			return 0, errors.New("MEMBER_DUP")
		}
		return 0, err
	}

	if err := tx.Commit().Error; err != nil {
		return 0, err
	}

	return member.ID, nil
}

// -------------------- login (แก้ตรงนี้) --------------------

func (s *authSvc) Login(req dto.LoginReq) (string, error) {
	identifier := req.Identifier
	if identifier == "" {
		identifier = req.Email
	}

	acc, err := s.repo.FindAccountByIdentifier(identifier)
	if err != nil {
		return "", errors.New("invalid email/student id or password")
	}
	if acc.IsLocked {
		return "", errors.New("account locked")
	}
	if !utils.CheckPassword(acc.PasswordHash, req.Password) {
		return "", errors.New("invalid email/student id or password")
	}

	role := "member"
	if acc.RoleID == 1 {
		role = "admin"
	}

	// ✅ optional: เช็คว่ามี profile จริง
	if role == "admin" {
		var admin entity.Admin
		if err := s.db.Where("member_account_id = ?", acc.ID).First(&admin).Error; err != nil {
			return "", errors.New("admin profile not found for this account")
		}
	} else {
		var member entity.Member
		if err := s.db.Where("member_account_id = ?", acc.ID).First(&member).Error; err != nil {
			return "", errors.New("member not found for this account")
		}

		// ✅ Set user to ONLINE and update last activity
		now := time.Now()
		s.db.Model(&entity.Member{}).
			Where("id = ?", member.ID).
			Updates(map[string]interface{}{
				"active_status_id": 1, // 1 = Online
				"last_activity":    now,
			})
	}

	// ✅ สำคัญที่สุด: token ต้องใส่ member_accounts.id
	token, err := utils.SignToken(acc.ID, role)
	if err != nil {
		return "", err
	}
	return token, nil
}

// -------------------- forgot password --------------------

func (s *authSvc) VerifyResetIdentity(identifier string, nationalID string) (string, error) {
	acc, err := s.repo.FindAccountByIdentifierAndNationalID(identifier, nationalID)
	if err != nil {
		return "", errors.New("information does not match")
	}
	if acc.IsLocked {
		return "", errors.New("account locked")
	}

	return utils.SignResetToken(acc.ID)
}

func (s *authSvc) ResetPassword(resetToken string, newPassword string) error {
	claims, err := utils.ParseResetToken(resetToken)
	if err != nil {
		return errors.New("invalid or expired token")
	}

	if len(newPassword) < 8 {
		return errors.New("password must be at least 8 characters")
	}

	hash, err := utils.HashPassword(newPassword)
	if err != nil {
		return err
	}

	return s.db.Model(&entity.MemberAccount{}).
		Where("id = ?", claims.UserID).
		Update("password_hash", hash).Error
}
