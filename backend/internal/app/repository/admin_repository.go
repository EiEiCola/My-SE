// backend/internal/repository/admin_repository.go
package repository

import (
	"errors"

	"github.com/sut68/team12/backend/internal/entity"
	"gorm.io/gorm"
)

type AdminRepository interface {
	GetByIDWithAccount(id uint) (*entity.Admin, error)
	UpdateProfile(id uint, patch map[string]any) error
	UpdateNationalID(id uint, hash string, last4 string) error
}

type adminRepository struct {
	db *gorm.DB
}

func NewAdminRepository(db *gorm.DB) AdminRepository {
	return &adminRepository{db: db}
}

func (r *adminRepository) GetByIDWithAccount(id uint) (*entity.Admin, error) {
	var admin entity.Admin

	// ✅ ใช้ JOIN + Preload เพื่อให้ email ติดมาแน่ และกัน password หลุด
	// - JOIN: ช่วยให้ relation ถูกผูกแม้ preload มี issue
	// - Preload: ให้ admin.MemberAccount ถูกเติมค่าใน struct
	err := r.db.
		Model(&entity.Admin{}).
		Joins("LEFT JOIN member_accounts ON member_accounts.id = admins.member_account_id").
		Preload("MemberAccount", func(db *gorm.DB) *gorm.DB {
			// เลือกเฉพาะ field ที่จำเป็น (กัน password หลุด)
			return db.Select("id", "email", "role_id", "member_id", "created_at", "updated_at", "deleted_at")
		}).
		Where("admins.id = ?", id).
		First(&admin).Error

	if err != nil {
		return nil, err
	}

	// ✅ ถ้าไม่มี member_account ผูกไว้ให้ชัดเจน (กัน null แปลกๆ)
	if admin.MemberAccountID == 0 {
		return &admin, nil
	}

	// ✅ บางเคส preload อาจไม่เติม (เช่น tag relation ไม่ตรง) -> fallback query email
	if admin.MemberAccount.ID == 0 || admin.MemberAccount.Email == "" {
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

	// ✅ whitelist fields ที่แก้ได้ (กันส่ง patch มาแก้ field สำคัญ)
	allowed := map[string]bool{
		"username":         true,
		"first_name":       true,
		"last_name":        true,
		"profile_picture":  true,
		"phone_number":     true,
		// ห้ามแก้:
		// "member_account_id", "national_id_hash", "national_id_last4", "created_at", ฯลฯ
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
