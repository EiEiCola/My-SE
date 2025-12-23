package services

import (
	"errors"

	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/entity"
)

type AdminRewardService interface {
	CreateReward(payload *entity.Reward) (*entity.Reward, error)
	UpdateReward(id uint, payload *entity.Reward) (*entity.Reward, error)
	DeleteReward(id uint) error

	GetAllReward() ([]entity.Reward, error)
	GetRewardByID(id uint) (*entity.Reward, error)
}

type adminRewardService struct {
	repo repository.AdminRewardRepository
}

func NewAdminRewardService(r repository.AdminRewardRepository) AdminRewardService {
	return &adminRewardService{repo: r}
}

func (s *adminRewardService) CreateReward(payload *entity.Reward) (*entity.Reward, error) {
	if payload == nil {
		return nil, errors.New("payload is required")
	}

	// ✅ validate ก่อน create (กัน admin_id = 0 และข้อมูลไม่ครบ)
	ok, err := entity.ValidateReward(*payload)
	if !ok {
		return nil, err
	}

	if err := s.repo.Create(payload); err != nil {
		return nil, err
	}
	return payload, nil
}

func (s *adminRewardService) UpdateReward(id uint, payload *entity.Reward) (*entity.Reward, error) {
	if payload == nil {
		return nil, errors.New("payload is required")
	}
	if id == 0 {
		return nil, errors.New("invalid id")
	}

	// ✅ เวลา update ถ้าไม่ได้ส่ง AdminID มา (เช่น controller ไม่ set)
	// แนะนำให้ "ไม่บังคับ validate AdminID" ตอน update หรือ ensure ให้ controller set AdminID เสมอ
	// ทางนี้เลือกแบบปลอดภัย: ให้ controller set AdminID เสมออยู่แล้ว -> validate ได้
	ok, err := entity.ValidateReward(*payload)
	if !ok {
		return nil, err
	}

	if err := s.repo.Update(id, payload); err != nil {
		return nil, err
	}
	return s.repo.GetByID(id)
}

func (s *adminRewardService) DeleteReward(id uint) error {
	if id == 0 {
		return errors.New("invalid id")
	}
	return s.repo.Delete(id)
}

// ✅ admin เห็นเฉพาะที่ยังอยู่
func (s *adminRewardService) GetAllReward() ([]entity.Reward, error) {
	return s.repo.GetAll()
}

func (s *adminRewardService) GetRewardByID(id uint) (*entity.Reward, error) {
	if id == 0 {
		return nil, errors.New("invalid id")
	}
	return s.repo.GetByID(id)
}
