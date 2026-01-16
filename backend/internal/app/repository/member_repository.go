package repository

import (
	"time"

	"github.com/sut68/team12/backend/internal/entity"
	"gorm.io/gorm"
)

type MemberRepository interface {
	FindByID(id uint) (*entity.Member, error)
	FindByAccountID(accountID uint) (*entity.Member, error)
	Update(member *entity.Member) error
	UpdateActiveStatus(memberID uint, statusID uint) error
	UpdateLastActivity(memberID uint) error
	SetInactiveMembersOffline(inactiveMinutes int) error
}

type memberRepository struct {
	db *gorm.DB
}

func NewMemberRepository(db *gorm.DB) MemberRepository {
	return &memberRepository{db: db}
}

func (r *memberRepository) FindByID(id uint) (*entity.Member, error) {
	var m entity.Member
	if err := r.db.
		Preload("Gender").
		Preload("ActiveStatus").
		Preload("MemberAccount").
		First(&m, id).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

// ✅ สำคัญ: ใช้ members.member_account_id ตรง ๆ
func (r *memberRepository) FindByAccountID(accountID uint) (*entity.Member, error) {
	var m entity.Member
	if err := r.db.
		Preload("Gender").
		Preload("ActiveStatus").
		Preload("MemberAccount").
		Where("member_account_id = ?", accountID).
		First(&m).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

// ✅ เปลี่ยนจาก Save() -> Updates() เพื่อบังคับ update field ที่ต้องการแน่นอน
func (r *memberRepository) Update(member *entity.Member) error {
	return r.db.Model(&entity.Member{}).
		Where("id = ?", member.ID).
		Updates(map[string]interface{}{
			"first_name":     member.FirstName,
			"last_name":      member.LastName,
			"username":       member.Username,
			"bio":            member.Bio,
			"dob":            member.Dob,
			"gender_id":      member.GenderID, // ✅ ตัวที่ต้องเปลี่ยน
			"member_picture": member.MemberPicture,
		}).Error
}

// ✅ Update Active Status (1 = Online, 2 = Offline)
func (r *memberRepository) UpdateActiveStatus(memberID uint, statusID uint) error {
	return r.db.Model(&entity.Member{}).
		Where("id = ?", memberID).
		Update("active_status_id", statusID).Error
}

// ✅ Update Last Activity Timestamp
func (r *memberRepository) UpdateLastActivity(memberID uint) error {
	now := time.Now()
	return r.db.Model(&entity.Member{}).
		Where("id = ?", memberID).
		Update("last_activity", now).Error
}

// ✅ Set inactive members to offline (called by cleanup service)
func (r *memberRepository) SetInactiveMembersOffline(inactiveMinutes int) error {
	cutoffTime := time.Now().Add(-time.Duration(inactiveMinutes) * time.Minute)
	return r.db.Model(&entity.Member{}).
		Where("active_status_id = ? AND (last_activity IS NULL OR last_activity < ?)", 1, cutoffTime).
		Update("active_status_id", 2).Error
}
