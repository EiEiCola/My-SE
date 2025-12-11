package services

import (
    "errors"

    "github.com/sut68/team12/backend/internal/app/repository"
    "github.com/sut68/team12/backend/internal/entity"
)

type MemberAccountService interface {
    Register(email, password string, roleID uint) (*entity.MemberAccount, error)
    Login(email, password string) (*entity.MemberAccount, error)
}

type memberAccountService struct {
    memberAccountRepo repository.MemberAccountRepository
}

func NewMemberAccountService(memberAccountRepo repository.MemberAccountRepository) MemberAccountService {
    return &memberAccountService{memberAccountRepo: memberAccountRepo}
}

// Register สร้าง MemberAccount ใหม่ (ตอนนี้ยังไม่สร้าง Member ให้อัตโนมัติ)
func (s *memberAccountService) Register(email, password string, roleID uint) (*entity.MemberAccount, error) {
    if existing, _ := s.memberAccountRepo.FindByEmail(email); existing != nil {
        return nil, errors.New("email already used")
    }

    // TODO: bcrypt ภายหลัง
    hashed := password

    acc := &entity.MemberAccount{
        Email:    email,
        Password: hashed,
        RoleID:   roleID,
        // MemberID ให้ไปเซ็ตเองใน DB ชั่วคราว
    }

    if err := s.memberAccountRepo.Create(acc); err != nil {
        return nil, err
    }

    return acc, nil
}

func (s *memberAccountService) Login(email, password string) (*entity.MemberAccount, error) {
    acc, err := s.memberAccountRepo.FindByEmail(email)
    if err != nil || acc.Password != password {
        return nil, errors.New("invalid email or password")
    }

    return acc, nil 
}
