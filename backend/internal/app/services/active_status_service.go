package services

import (
	
    "github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/entity"
)


type ActiveStatusService interface {
    // GetAllStatuses ดึง ActiveStatus ทั้งหมด
    GetAllStatuses() ([]entity.ActiveStatus, error)

    // GetStatusByID ดึง ActiveStatus ตาม ID
    GetStatusByID(id uint) (*entity.ActiveStatus, error)
}

type activeStatusService struct {
    activeStatusRepo repository.ActiveStatusRepository
}


func NewActiveStatusService(activeStatusRepo repository.ActiveStatusRepository) ActiveStatusService {
    return &activeStatusService{activeStatusRepo: activeStatusRepo}
}


func (s *activeStatusService) GetAllStatuses() ([]entity.ActiveStatus, error) {
    return s.activeStatusRepo.FindAll()
}

func (s *activeStatusService) GetStatusByID(id uint) (*entity.ActiveStatus, error) {
    return s.activeStatusRepo.FindByID(id)
}
