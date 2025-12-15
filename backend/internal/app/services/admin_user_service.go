package services

import "github.com/sut68/team12/backend/internal/app/repository"

type AdminUserService interface {
	Search(email, code string) ([]repository.AdminUserRow, error)
	Lock(id uint, reason string) error
	Unlock(id uint) error
}

type adminUserService struct {
	repo repository.AdminUserRepository
}

func NewAdminUserService(repo repository.AdminUserRepository) AdminUserService {
	return &adminUserService{repo: repo}
}

func (s *adminUserService) Search(email, code string) ([]repository.AdminUserRow, error) {
	return s.repo.Search(email, code)
}

func (s *adminUserService) Lock(id uint, reason string) error {
	return s.repo.Lock(id, reason)
}

func (s *adminUserService) Unlock(id uint) error {
	return s.repo.Unlock(id)
}
