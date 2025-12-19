// backend/internal/app/repository/admin_repository.go
package repository

import (
	"errors"

	"github.com/sut68/team12/backend/internal/entity"
	"gorm.io/gorm"
)

type AdminRepository interface {
	// เดิม (ตาม admins.id)
	GetByIDWithAccount(id uint) (*entity.Admin, error)

	// ✅ ใหม่ (ตาม member_account_id จาก JWT)
	GetByMemberAccountIDWithAccount(memberAccountID uint) (*entity.Admin, error)

	UpdateProfile(id uint, patch map[string]any) error
	UpdateNationalID(id uint, hash string, last4 string) error
}

type adminRepository struct {
	db *gorm.DB
}

func NewAdminRepository(db *gorm.DB) AdminRepository {
	return &adminRepository{db: db}
}

// ✅ ใช้ admins.member_account_id ให้ถูกต้อง (ไม่ผูก admins.id = member_accounts.id)
func (r *adminRepository) GetByIDWithAccount(id uint) (*entity.Admin, error) {
	var admin entity.Admin

	err := r.db.
		Model(&entity.Admin{}).
		Joins("LEFT JOIN member_accounts ON member_accounts.id = admins.member_account_id").
		Preload("MemberAccount", func(db *gorm.DB) *gorm.DB {
			// เลือกเท่าที่จำเป็น (กัน password หลุด)
			return db.Select("id", "email", "role_id", "created_at", "updated_at", "deleted_at")
		}).
		Where("admins.id = ?", id).
		First(&admin).Error

	if err != nil {
		return nil, err
	}

	// fallback กรณี preload ไม่มา
	if admin.MemberAccountID != 0 && (admin.MemberAccount.ID == 0 || admin.MemberAccount.Email == "") {
		var email string
		e := r.db.Table("member_accounts").
			Select("email").
			Where("id = ?", admin.MemberAccountID).
			Scan(&email).Error
		if e == nil && email != "" {
			admin.MemberAccount.Email = email
		}
	}

	return &admin, nil
}

// ✅ ใหม่: ดึง admin ด้วย member_account_id (ใช้กับ JWT user_id)
func (r *adminRepository) GetByMemberAccountIDWithAccount(memberAccountID uint) (*entity.Admin, error) {
	var admin entity.Admin

	err := r.db.
		Model(&entity.Admin{}).
		Joins("LEFT JOIN member_accounts ON member_accounts.id = admins.member_account_id").
		Preload("MemberAccount", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "email", "role_id", "created_at", "updated_at", "deleted_at")
		}).
		Where("admins.member_account_id = ?", memberAccountID).
		First(&admin).Error

	if err != nil {
		return nil, err
	}

	// fallback กรณี preload ไม่มา
	if admin.MemberAccountID != 0 && (admin.MemberAccount.ID == 0 || admin.MemberAccount.Email == "") {
		var email string
		e := r.db.Table("member_accounts").
			Select("email").
			Where("id = ?", admin.MemberAccountID).
			Scan(&email).Error
		if e == nil && email != "" {
			admin.MemberAccount.Email = email
		}
	}

	return &admin, nil
}

func (r *adminRepository) UpdateProfile(id uint, patch map[string]any) error {
	if len(patch) == 0 {
		return nil
	}

	allowed := map[string]bool{
		"username":        true,
		"first_name":      true,
		"last_name":       true,
		"profile_picture": true,
		"phone_number":    true,
	}

	safe := map[string]any{}
	for k, v := range patch {
		if allowed[k] {
			safe[k] = v
		}
	}

	if len(safe) == 0 {
		return errors.New("no updatable fields")
	}

	return r.db.Model(&entity.Admin{}).Where("id = ?", id).Updates(safe).Error
}

func (r *adminRepository) UpdateNationalID(id uint, hash string, last4 string) error {
	return r.db.Model(&entity.Admin{}).
		Where("id = ?", id).
		Updates(map[string]any{
			"national_id_hash":  hash,
			"national_id_last4": last4,
		}).Error
}
