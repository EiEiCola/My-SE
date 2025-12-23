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

	// ✅ forgot password
	VerifyResetIdentity(identifier string, nationalID string) (string, error) // returns reset_token
	ResetPassword(resetToken string, newPassword string) error
}

type authSvc struct {
	db   *gorm.DB
	repo repository.AuthRepository
}

func NewAuthService(db *gorm.DB, repo repository.AuthRepository) AuthService {
	return &authSvc{db: db, repo: repo}
}

// ✅ อ่านแต้มเริ่มต้นจาก env (dev=300 / prod=0)
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

func (s *authSvc) Register(req dto.RegisterReq) (uint, error) {
	// ✅ 1) เช็ค email ซ้ำ
	_, err := s.repo.FindAccountByEmail(req.Email)
	if err == nil {
		return 0, errors.New("EMAIL_DUP")
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return 0, err
	}

	// ✅ 2) เช็ค student_id ซ้ำ
	_, err = s.repo.FindMemberByStudentID(req.StudentID)
	if err == nil {
		return 0, errors.New("STUDENT_ID_DUP")
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return 0, err
	}

	// ✅ 3) เช็ค national_id ซ้ำ
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

	// parse dob
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

	// ✅ NEW: สร้างแต้มเริ่มต้นตอนสมัคร (ปลอดภัย: create-if-not-exists)
	initialPoints := getInitialPointsFromEnv()

	// ถ้ามี balance อยู่แล้ว (จาก seed/การสมัครรอบก่อน) -> ไม่สร้างซ้ำ
	var existingBal entity.MemberPointBalance
	balErr := tx.Where("member_id = ?", member.ID).First(&existingBal).Error
	if balErr != nil {
		if errors.Is(balErr, gorm.ErrRecordNotFound) {
			bal := entity.MemberPointBalance{
				MemberID:   member.ID,
				TotalPoint: initialPoints,
			}
			if ok, vErr := entity.ValidateMemberPointBalance(bal); !ok {
				tx.Rollback()
				return 0, vErr
			}
			if err := tx.Create(&bal).Error; err != nil {
				tx.Rollback()
				return 0, err
			}
		} else {
			tx.Rollback()
			return 0, balErr
		}
	}
	// ถ้าเจอ existingBal แล้ว -> ไม่ทำอะไร (กัน unique ชน)

	// ✅ OPTIONAL: บันทึก transaction ตอนแจกแต้มเริ่มต้น (ถ้า initial > 0)
	// หมายเหตุ: ถ้า balance มีอยู่แล้วจาก seed/เก่า เรา "ไม่สร้าง txn ซ้ำ" ด้วย idempotency key
	if initialPoints > 0 {
		// สร้าง/หา rule "SEED_INIT" แบบง่าย ๆ (ไม่ให้ซ้ำ)
		const activityType = "SEED_INIT"
		var rule entity.PointRule
		err := tx.Where("activity_type = ?", activityType).First(&rule).Error
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				rule = entity.PointRule{
					ActivityType:  activityType,
					Description:   "Initial points on register (dev/test)",
					ActivityPoint: initialPoints,
					DailyLimit:    0,
				}
				if ok, vErr := entity.ValidatePointRule(rule); !ok {
					tx.Rollback()
					return 0, vErr
				}
				if err := tx.Create(&rule).Error; err != nil {
					tx.Rollback()
					return 0, err
				}
			} else {
				tx.Rollback()
				return 0, err
			}
		}

		idemKey := "register:init:" + strconv.FormatUint(uint64(member.ID), 10)

		var cnt int64
		if err := tx.Model(&entity.PointTransaction{}).
			Where("idempotency_key = ?", idemKey).
			Count(&cnt).Error; err != nil {
			tx.Rollback()
			return 0, err
		}

		if cnt == 0 {
			pt := entity.PointTransaction{
				MemberID:       member.ID,
				PointRuleID:    &rule.ID,
				PointChange:    initialPoints,
				TxnType:        entity.PointTxnEarn,
				BalanceAfter:   initialPoints,
				SourceType:     "SEED_INIT",
				SourceID:       1,
				IdempotencyKey: idemKey,
			}

			if ok, vErr := entity.ValidatePointTransaction(pt); !ok {
				tx.Rollback()
				return 0, vErr
			}

			if err := tx.Create(&pt).Error; err != nil {
				tx.Rollback()
				return 0, err
			}
		}
	}

	if err := tx.Commit().Error; err != nil {
		return 0, err
	}

	return member.ID, nil
}

func (s *authSvc) Login(req dto.LoginReq) (string, error) {
	identifier := req.Identifier
	if identifier == "" {
		identifier = req.Email // ✅ รองรับ FE เก่าที่ส่ง email
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

	token, err := utils.SignToken(acc.ID, role)
	if err != nil {
		return "", err
	}
	return token, nil
}

// ✅ Verify Identity: identifier + national_id -> ออก reset_token อายุสั้น
func (s *authSvc) VerifyResetIdentity(identifier string, nationalID string) (string, error) {
	acc, err := s.repo.FindAccountByIdentifierAndNationalID(identifier, nationalID)
	if err != nil {
		// ไม่บอกว่าอันไหนผิด เพื่อกันเดา account
		return "", errors.New("information does not match")
	}
	if acc.IsLocked {
		return "", errors.New("account locked")
	}

	resetToken, err := utils.SignResetToken(acc.ID)
	if err != nil {
		return "", err
	}
	return resetToken, nil
}

// ✅ Reset Password: ใช้ reset_token (แทน member_id) เพื่อความปลอดภัย
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
