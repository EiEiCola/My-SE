package repository

import (
	"github.com/sut68/team12/backend/internal/dto"
	"github.com/sut68/team12/backend/internal/entity"
	"gorm.io/gorm"
)

type MemberRewardRepository interface {
	GetRewardByID(id uint) (*entity.Reward, error)

	GetOrCreateBalance(memberID uint) (*entity.MemberPointBalance, error)
	UpdateBalance(memberID uint, newTotal int) error
	GetBalance(memberID uint) (int, error)

	CreatePointTransaction(txn *entity.PointTransaction) error
	CreateMemberReward(mr *entity.MemberReward) error

	// ✅ เปลี่ยน return type เป็น DTO
	GetMyStickers(memberID uint) ([]dto.MyStickerDTO, error)
}

type memberRewardRepository struct{ db *gorm.DB }

func NewMemberRewardRepository(db *gorm.DB) MemberRewardRepository {
	return &memberRewardRepository{db: db}
}

func (r *memberRewardRepository) GetRewardByID(id uint) (*entity.Reward, error) {
	var reward entity.Reward
	if err := r.db.First(&reward, id).Error; err != nil {
		return nil, err
	}
	return &reward, nil
}

func (r *memberRewardRepository) GetOrCreateBalance(memberID uint) (*entity.MemberPointBalance, error) {
	var bal entity.MemberPointBalance
	err := r.db.Where("member_id = ?", memberID).First(&bal).Error
	if err == nil {
		return &bal, nil
	}
	if err != gorm.ErrRecordNotFound {
		return nil, err
	}

	bal = entity.MemberPointBalance{MemberID: memberID, TotalPoint: 0}
	if err := r.db.Create(&bal).Error; err != nil {
		return nil, err
	}
	return &bal, nil
}

func (r *memberRewardRepository) UpdateBalance(memberID uint, newTotal int) error {
	return r.db.Model(&entity.MemberPointBalance{}).
		Where("member_id = ?", memberID).
		Update("total_point", newTotal).Error
}

func (r *memberRewardRepository) GetBalance(memberID uint) (int, error) {
	bal, err := r.GetOrCreateBalance(memberID)
	if err != nil {
		return 0, err
	}
	return bal.TotalPoint, nil
}

func (r *memberRewardRepository) CreatePointTransaction(txn *entity.PointTransaction) error {
	return r.db.Create(txn).Error
}

func (r *memberRewardRepository) CreateMemberReward(mr *entity.MemberReward) error {
	return r.db.Create(mr).Error
}

// ✅ ใช้ DTO รับผล JOIN + Scan (ชัวร์สุด)
func (r *memberRewardRepository) GetMyStickers(memberID uint) ([]dto.MyStickerDTO, error) {
	var items []dto.MyStickerDTO

	err := r.db.
		Table("member_rewards").
		Select(`
			member_rewards.id,
			member_rewards.member_id,
			member_rewards.reward_id,
			member_rewards.redeemed_at,
			member_rewards.reward_name_snapshot,
			member_rewards.point_required_snapshot,
			rewards.reward_name as reward_name,
			rewards.reward_picture as reward_picture,
			rewards.point_required as point_required
		`).
		Joins("LEFT JOIN rewards ON rewards.id = member_rewards.reward_id").
		Where("member_rewards.member_id = ?", memberID).
		Order("member_rewards.redeemed_at DESC").
		Scan(&items).Error

	return items, err
}
