package repository

import (

    "github.com/sut68/team12/backend/internal/entity"
    "gorm.io/gorm"
)

type AdminRepository interface {
    // FindByID ดึง Admin จาก primary key (ID)
    FindByID(id uint) (*entity.Admin, error)

    // FindByAccountID ดึง Admin จาก MemberAccountID
    FindByAccountID(accountID uint) (*entity.Admin, error)

    // FindAll ดึง Admin ทั้งหมด (เช่นสำหรับหน้า list)
    FindAll() ([]entity.Admin, error)

    // Create สร้าง Admin ใหม่ในฐานข้อมูล
    Create(admin *entity.Admin) error

    // Update อัปเดตข้อมูล Admin ที่มีอยู่
    Update(admin *entity.Admin) error
}

type adminRepository struct {
    db *gorm.DB
}

func NewAdminRepository(db *gorm.DB) AdminRepository {
    return &adminRepository{db: db}
}

// ดึง Admin จาก ID พร้อม preload MemberAccount
func (r *adminRepository) FindByID(id uint) (*entity.Admin, error) {
    var admin entity.Admin
    if err := r.db.
        Preload("MemberAccount").
        First(&admin, id).Error; err != nil {
        return nil, err
    }
    return &admin, nil
}

// ดึง Admin จาก MemberAccountID (ใช้ตอนรู้ account แล้วอยากดูข้อมูล admin)
func (r *adminRepository) FindByAccountID(accountID uint) (*entity.Admin, error) {
    var admin entity.Admin
    if err := r.db.
        Preload("MemberAccount").
        Where("member_account_id = ?", accountID).
        First(&admin).Error; err != nil {
        return nil, err
    }
    return &admin, nil
}

// ดึง Admin ทุกคน (ใช้กับหน้า list)
func (r *adminRepository) FindAll() ([]entity.Admin, error) {
    var admins []entity.Admin
    if err := r.db.
        Preload("MemberAccount").
        Find(&admins).Error; err != nil {
        return nil, err
    }
    return admins, nil
}

// สร้าง record Admin ใหม่ในฐานข้อมูล
func (r *adminRepository) Create(admin *entity.Admin) error {
    return r.db.Create(admin).Error
}

// อัปเดตข้อมูล Admin ที่มีอยู่ (ชื่อ นามสกุล ฯลฯ)
func (r *adminRepository) Update(admin *entity.Admin) error {
    return r.db.Save(admin).Error
}
