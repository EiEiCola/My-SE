package services

import (
	
	"fmt"

	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/entity"
)

type GenderService interface {
	GetAll() ([]entity.Gender, error)
	ValidateGenderID(id uint) error
}

type genderService struct {
	repo repository.GenderRepository
}

func NewGenderService(r repository.GenderRepository) GenderService {
	return &genderService{repo: r}
}

func (s *genderService) GetAll() ([]entity.Gender, error) {
	return s.repo.FindAll()
}

func (s *genderService) ValidateGenderID(id uint) error {
	if id == 0 {
		return fmt.Errorf("gender_id must not be zero")
	}

	ok, err := s.repo.ExistsByID(id)
	if !ok || err != nil {
		return fmt.Errorf("invalid gender_id")
	}
	return nil
}
