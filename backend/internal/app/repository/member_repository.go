package repository

import (
    "github.com/sut68/team12/backend/internal/entity"
    "gorm.io/gorm"
)

// interface สำหรับจัดการข้อมูล Member 
type MemberRepository interface {
    // FindByID ดึงข้อมูล Member จาก primary key (ID)
    FindByID(id uint) (*entity.Member, error)

    // FindByAccountID ดึงโปรไฟล์จาก MemberAccountID
    FindByAccountID(accountID uint) (*entity.Member, error)

    // Update แก้ไขข้อมูล Member ที่มีอยู่ในฐานข้อมูล
    Update(member *entity.Member) error
}

type memberRepository struct {
    db *gorm.DB
}

func NewMemberRepository(db *gorm.DB) MemberRepository {
    return &memberRepository{db: db}
}

// FindByID
// ดึง Member จาก ID พร้อม preload ความสัมพันธ์ที่สำคัญ
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

// FindByAccountID
// ดึง Member โดยใช้ค่า accountID จากตาราง member_accounts
// โครง FK ใน entity คือ member_accounts.member_id -> members.id
// เลยต้อง JOIN เอา ไม่สามารถ Where("member_account_id = ?") ได้
func (r *memberRepository) FindByAccountID(accountID uint) (*entity.Member, error) {
    var m entity.Member

    err := r.db.
        Joins("JOIN member_accounts ma ON ma.member_id = members.id").
        Preload("Gender").
        Preload("ActiveStatus").
        Preload("MemberAccount").
        Where("ma.id = ?", accountID).
        First(&m).Error

    if err != nil {
        return nil, err
    }

    return &m, nil
}

// ใช้สำหรับบันทึกการเปลี่ยนแปลงของ Member กลับไปที่ฐานข้อมูล
func (r *memberRepository) Update(member *entity.Member) error {
    return r.db.Save(member).Error
}
