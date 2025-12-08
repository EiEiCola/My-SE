package repository

import (
	"github.com/sut68/team12/backend/internal/entity"
	"gorm.io/gorm"
)

type PointTransactionRepository interface {
	CreatePointTransaction(tx *entity.PointTransaction) error
	GetPointTransactionByMemberID(memberID uint) ([]entity.PointTransaction, error)
	CountPointTransactionByRuleToday(memberID uint, pointRuleID uint, date string) (int64, error)
}

type pointTransactionRepository struct {
	db *gorm.DB
}

func NewPointTransactionRepository(db *gorm.DB) PointTransactionRepository {
	return &pointTransactionRepository{db: db}
}

func (r *pointTransactionRepository) CreatePointTransaction(tx *entity.PointTransaction) error {
	return r.db.Create(tx).Error
}

func (r *pointTransactionRepository) GetPointTransactionByMemberID(memberID uint) ([]entity.PointTransaction, error) {
	var txs []entity.PointTransaction

	err := r.db.
		Preload("PointRule").
		Where("member_id = ?", memberID).
		Order("created_at DESC").
		Find(&txs).Error

	return txs, err
}

func (r *pointTransactionRepository) CountPointTransactionByRuleToday(memberID uint, pointRuleID uint, date string) (int64, error) {
	var count int64

	err := r.db.Model(&entity.PointTransaction{}).
		Where("member_id = ? AND point_rule_id = ? AND DATE(created_at) = ?", memberID, pointRuleID, date).
		Count(&count).Error

	return count, err
}
