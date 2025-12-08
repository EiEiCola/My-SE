package repository

import (
	"errors"

	"github.com/sut68/team12/backend/internal/entity"
	"gorm.io/gorm"
)

type MemberPointBalanceRepository interface {
	GetMemberPointBalanceByMemberID(memberID uint) (*entity.MemberPointBalance, error)
	AddPointToMember(memberID uint, point int) error
	DeductPointFromMember(memberID uint, point int) error
}

type memberPointBalanceRepository struct {
	db *gorm.DB
}

func NewMemberPointBalanceRepository(db *gorm.DB) MemberPointBalanceRepository {
	return &memberPointBalanceRepository{db: db}
}

func (r *memberPointBalanceRepository) GetMemberPointBalanceByMemberID(memberID uint) (*entity.MemberPointBalance, error) {
	var balance entity.MemberPointBalance

	err := r.db.Where("member_id = ?", memberID).First(&balance).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// ถ้ายังไม่มี record ให้สร้างใหม่
			balance = entity.MemberPointBalance{
				MemberID:   memberID,
				TotalPoint: 0,
			}
			if err := r.db.Create(&balance).Error; err != nil {
				return nil, err
			}
			return &balance, nil
		}
		return nil, err
	}

	return &balance, nil
}

func (r *memberPointBalanceRepository) AddPointToMember(memberID uint, point int) error {
	balance, err := r.GetMemberPointBalanceByMemberID(memberID)
	if err != nil {
		return err
	}

	balance.TotalPoint += point
	return r.db.Save(balance).Error
}

func (r *memberPointBalanceRepository) DeductPointFromMember(memberID uint, point int) error {
	balance, err := r.GetMemberPointBalanceByMemberID(memberID)
	if err != nil {
		return err
	}

	if balance.TotalPoint < point {
		return errors.New("not enough points")
	}

	balance.TotalPoint -= point
	return r.db.Save(balance).Error
}
