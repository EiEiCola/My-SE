package services

import (

    "github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/entity"
)


type AdminService interface {
    // GetByID ดึง Admin จาก ID
    GetByID(id uint) (*entity.Admin, error)

    // GetByAccountID ดึง Admin จาก MemberAccountID
    GetByAccountID(accountID uint) (*entity.Admin, error)

    // ListAdmins ดึง Admin ทั้งหมด
    ListAdmins() ([]entity.Admin, error)

    // CreateAdmin สร้าง Admin ใหม่จากข้อมูลที่รับมา
    CreateAdmin(input CreateAdminInput) (*entity.Admin, error)

    // UpdateAdminProfile แก้ไขชื่อ/นามสกุลของ Admin
    UpdateAdminProfile(id uint, input UpdateAdminInput) (*entity.Admin, error)
}

// struct สำหรับรับข้อมูลตอนสร้าง Admin ใหม่
type CreateAdminInput struct {
    AdminID         int    `json:"admin_id"`
    FirstName       string `json:"first_name"`
    LastName        string `json:"last_name"`
    MemberAccountID uint   `json:"member_account_id"`
}

// struct สำหรับรับข้อมูลตอนแก้ไขโปรไฟล์ Admin
type UpdateAdminInput struct {
    FirstName string `json:"first_name"`
    LastName  string `json:"last_name"`
}

type adminService struct {
    adminRepo repository.AdminRepository
}

func NewAdminService(adminRepo repository.AdminRepository) AdminService {
    return &adminService{adminRepo: adminRepo}
}

// ใช้ดึง Admin จาก ID
func (s *adminService) GetByID(id uint) (*entity.Admin, error) {
    return s.adminRepo.FindByID(id)
}

// ใช้ดึง Admin จาก MemberAccountID (เช่นจาก context auth ทีหลัง)
func (s *adminService) GetByAccountID(accountID uint) (*entity.Admin, error) {
    return s.adminRepo.FindByAccountID(accountID)
}

// ดึง Admin ทั้งหมด (ใช้ในหน้า list แอดมิน)
func (s *adminService) ListAdmins() ([]entity.Admin, error) {
    return s.adminRepo.FindAll()
}

// สร้าง Admin ใหม่จากข้อมูล input
func (s *adminService) CreateAdmin(input CreateAdminInput) (*entity.Admin, error) {
    admin := &entity.Admin{
        AdminID:         input.AdminID,
        FirstName:       input.FirstName,
        LastName:        input.LastName,
        MemberAccountID: input.MemberAccountID,
    }

    if err := s.adminRepo.Create(admin); err != nil {
        return nil, err
    }
    return admin, nil
}

// แก้ไขชื่อ/นามสกุลของ Admin
func (s *adminService) UpdateAdminProfile(id uint, input UpdateAdminInput) (*entity.Admin, error) {
    admin, err := s.adminRepo.FindByID(id)
    if err != nil {
        return nil, err
    }

    admin.FirstName = input.FirstName
    admin.LastName = input.LastName

    if err := s.adminRepo.Update(admin); err != nil {
        return nil, err
    }

    return admin, nil
}
