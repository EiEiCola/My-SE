package services

import (
	"errors"

	"github.com/sut68/team12/backend/internal/app/repository"
	"golang.org/x/crypto/bcrypt"
)

type ResetService interface {
	Verify(identifier, nationalID string) (uint, error)
	ResetPassword(accountID uint, newPassword string) error
}

type resetService struct {
	repo repository.ResetRepository
}

func NewResetService(repo repository.ResetRepository) ResetService {
	return &resetService{repo}
}

func (s *resetService) Verify(identifier, nationalID string) (uint, error) {

	member, account, err := s.repo.FindMemberForReset(identifier)
	if err != nil {
		return 0, err
	}

	if member.NationalID != nationalID {
		return 0, errors.New("national ID does not match")
	}

	return account.ID, nil
}

func (s *resetService) ResetPassword(accountID uint, newPassword string) error {

	hash, _ := bcrypt.GenerateFromPassword([]byte(newPassword), 12)

	return s.repo.UpdatePassword(accountID, string(hash))
}
