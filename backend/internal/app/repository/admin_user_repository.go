package repository

import "gorm.io/gorm"

type AdminUserRow struct {
	ID       uint   `json:"id"`
	Username string `json:"username"`
	Email    string `json:"email"`
	Code     string `json:"code"`
	IsLocked bool   `json:"is_locked"`
}

type AdminUserRepository interface {
	Search(email, code string) ([]AdminUserRow, error)
	Lock(id uint, reason string) error
	Unlock(id uint) error
}

type adminUserRepository struct {
	db *gorm.DB
}

func NewAdminUserRepository(db *gorm.DB) AdminUserRepository {
	return &adminUserRepository{db: db}
}

// ✅ IMPORTANT: ปรับ field code ให้ตรง DB จริงของเนย
// ตอนนี้ใช้ members.student_id เป็น "รหัสนักศึกษา"
func (r *adminUserRepository) Search(email, code string) ([]AdminUserRow, error) {
	q := r.db.Table("member_accounts AS ma").
		Select(`
			ma.id AS id,
			COALESCE(m.username, '') AS username,
			ma.email AS email,
			COALESCE(m.student_id, '') AS code,
			ma.is_locked AS is_locked
		`).
		Joins("LEFT JOIN members m ON m.id = ma.member_id").
		Where("ma.deleted_at IS NULL")

	if email != "" {
		q = q.Where("ma.email ILIKE ?", "%"+email+"%")
	}
	if code != "" {
		q = q.Where("m.student_id ILIKE ?", "%"+code+"%")
	}

	var out []AdminUserRow
	if err := q.Order("ma.id DESC").Find(&out).Error; err != nil {
		return nil, err
	}
	return out, nil
}

func (r *adminUserRepository) Lock(id uint, reason string) error {
	return r.db.Table("member_accounts").
		Where("id = ?", id).
		Updates(map[string]any{
			"is_locked":     true,
			"locked_reason": reason,
		}).Error
}

func (r *adminUserRepository) Unlock(id uint) error {
	return r.db.Table("member_accounts").
		Where("id = ?", id).
		Updates(map[string]any{
			"is_locked":     false,
			"locked_reason": "",
		}).Error
}
