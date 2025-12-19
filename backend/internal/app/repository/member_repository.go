package repository

import (
	"github.com/sut68/team12/backend/internal/entity"
	"gorm.io/gorm"
)

type MemberRepository interface {
	FindByID(id uint) (*entity.Member, error)
	FindByAccountID(accountID uint) (*entity.Member, error)
	Update(member *entity.Member) error
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
			"first_name":      member.FirstName,
			"last_name":       member.LastName,
			"username":        member.Username,
			"bio":             member.Bio,
			"dob":             member.Dob,
			"gender_id":       member.GenderID,      // ✅ ตัวที่ต้องเปลี่ยน
			"member_picture":  member.MemberPicture,
		}).Error
}
