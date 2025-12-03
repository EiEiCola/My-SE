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
// ดึง Member จาก MemberAccountID (ใช้ตอนที่เรารู้ account แต่ยังไม่รู้ member)
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

// ใช้สำหรับบันทึกการเปลี่ยนแปลงของ Member กลับไปที่ฐานข้อมูล
func (r *memberRepository) Update(member *entity.Member) error {
    return r.db.Save(member).Error
}
