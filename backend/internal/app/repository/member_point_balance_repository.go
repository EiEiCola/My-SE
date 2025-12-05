package repository

import (
	
    "gorm.io/gorm"
    "github.com/sut68/team12/backend/internal/entity"
)

type MemberPointBalanceRepository interface {
    GetByMemberID(memberID uint) (*entity.MemberPointBalance, error)
    Create(balance *entity.MemberPointBalance) error
    Update(balance *entity.MemberPointBalance) error
}

type memberPointBalanceRepository struct {
    db *gorm.DB
}

func NewMemberPointBalanceRepository(db *gorm.DB) MemberPointBalanceRepository {
    return &memberPointBalanceRepository{db}
}

func (r *memberPointBalanceRepository) GetByMemberID(memberID uint) (*entity.MemberPointBalance, error) {
    var balance entity.MemberPointBalance
    err := r.db.Where("member_id = ?", memberID).First(&balance).Error
    return &balance, err
}

func (r *memberPointBalanceRepository) Create(balance *entity.MemberPointBalance) error {
    return r.db.Create(balance).Error
}

func (r *memberPointBalanceRepository) Update(balance *entity.MemberPointBalance) error {
    return r.db.Save(balance).Error
}
