package services

import (
	"errors"

	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/entity"
	"golang.org/x/crypto/bcrypt"
)

type AuthService interface {
	Register(email, password string, roleID uint) (*entity.MemberAccount, error)
	Login(email, password string) (*entity.MemberAccount, error)
}

type authService struct {
	authRepo repository.AuthRepository
}

func NewAuthService(authRepo repository.AuthRepository) AuthService {
	return &authService{authRepo}
}

// REGISTER
func (s *authService) Register(email, password string, roleID uint) (*entity.MemberAccount, error) {

	// 1) check duplicate email
	existing, _ := s.authRepo.FindByEmail(email)
	if existing != nil {
		return nil, errors.New("email already used")
	}

	// 2) hash password
	hashed, _ := bcrypt.GenerateFromPassword([]byte(password), 12)

	// 3) create new MemberAccount
	acc := &entity.MemberAccount{
		Email:    email,
		Password: string(hashed),
		RoleID:   roleID,
	}

	// 4) save to DB
	if err := s.authRepo.Create(acc); err != nil {
		return nil, err
	}

	return acc, nil
}

// LOGIN
func (s *authService) Login(email, password string) (*entity.MemberAccount, error) {

	// 1) fetch account
	acc, err := s.authRepo.FindByEmail(email)
	if err != nil {
		return nil, errors.New("invalid email or password")
	}

	// 2) compare password
	if bcrypt.CompareHashAndPassword([]byte(acc.Password), []byte(password)) != nil {
		return nil, errors.New("invalid email or password")
	}

	return acc, nil
}
