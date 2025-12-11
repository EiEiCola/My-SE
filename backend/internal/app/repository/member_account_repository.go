package repository

import (
    "gorm.io/gorm"
    "github.com/sut68/team12/backend/internal/entity"
)

type MemberAccountRepository interface {
    // Create สร้าง member account ใหม่
    Create(account *entity.MemberAccount) error

    // FindByEmail ดึงข้อมูล member account จาก email
    // ถ้าไม่เจอจะคืน error จาก gorm กลับไป (เช่น gorm.ErrRecordNotFound)
    FindByEmail(email string) (*entity.MemberAccount, error)

    // FindByID ดึงข้อมูล member account จาก primary key (ID)
    FindByID(id uint) (*entity.MemberAccount, error) 

    // Update อัปเดตข้อมูล member account ที่มีอยู่ในฐานข้อมูล
    Update(account *entity.MemberAccount) error
}

// struct ตัวนี้คือ implementation จริงของ MemberAccountRepository ที่ใช้ gorm.DB
type memberAccountRepository struct {
    db *gorm.DB // dependency: ตัวเชื่อมต่อฐานข้อมูล
}

// ฟังก์ชันสำหรับสร้าง instance ของ repository ให้ service เอาไปใช้
func NewMemberAccountRepository(db *gorm.DB) MemberAccountRepository {
    return &memberAccountRepository{db: db}
}

// Create
// ใช้สำหรับ insert record ใหม่ของ MemberAccount ลงฐานข้อมูล
func (r *memberAccountRepository) Create(account *entity.MemberAccount) error {
    return r.db.Create(account).Error
}

// FindByEmail
// ใช้สำหรับค้นหา MemberAccount จาก email
// ถ้าไม่เจอ หรือเกิด error อื่น ๆ จะคืน nil กับ error กลับไปให้ service handle ต่อ
func (r *memberAccountRepository) FindByEmail(email string) (*entity.MemberAccount, error) {
    var acc entity.MemberAccount
    if err := r.db.Where("email = ?", email).First(&acc).Error; err != nil {
        return nil, err
    }
    return &acc, nil
}

// FindByID
// ใช้สำหรับค้นหา MemberAccount จากค่า primary key (ID)
// ถ้าไม่เจอ หรือ error จะคืน nil กับ error กลับไป
func (r *memberAccountRepository) FindByID(id uint) (*entity.MemberAccount, error) {
    var acc entity.MemberAccount
    if err := r.db.First(&acc, id).Error; err != nil {
        return nil, err
    }
    return &acc, nil
}

// Update
// ใช้สำหรับอัปเดตข้อมูล MemberAccount ที่มีอยู่ (เช่น เปลี่ยน email, password ฯลฯ)
// Save จะเช็คจาก primary key (ID) ถ้ามีก็ update ถ้าไม่มีคือ insert
func (r *memberAccountRepository) Update(account *entity.MemberAccount) error {
    return r.db.Save(account).Error
}
