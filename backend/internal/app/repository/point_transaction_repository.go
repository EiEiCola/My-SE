package repository

import (
	
    "gorm.io/gorm"
    "github.com/sut68/team12/backend/internal/entity"
)

type PointTransactionRepository interface {
    Create(tx *entity.PointTransaction) error
    GetByMemberID(memberID uint) ([]entity.PointTransaction, error)
    GetByRule(memberID uint, pointRuleID uint) ([]entity.PointTransaction, error)
}

type pointTransactionRepository struct {
    db *gorm.DB
}

func NewPointTransactionRepository(db *gorm.DB) PointTransactionRepository {
    return &pointTransactionRepository{db}
}

func (r *pointTransactionRepository) Create(tx *entity.PointTransaction) error {
    return r.db.Create(tx).Error
}

func (r *pointTransactionRepository) GetByMemberID(memberID uint) ([]entity.PointTransaction, error) {
    var transactions []entity.PointTransaction
    err := r.db.
        Where("member_id = ?", memberID).
        Order("created_at DESC").
        Find(&transactions).Error

    return transactions, err
}

func (r *pointTransactionRepository) GetByRule(memberID uint, pointRuleID uint) ([]entity.PointTransaction, error) {
    var transactions []entity.PointTransaction
    err := r.db.
        Where("member_id = ? AND point_rule_id = ?", memberID, pointRuleID).
        Order("created_at DESC").
        Find(&transactions).Error

    return transactions, err
}
