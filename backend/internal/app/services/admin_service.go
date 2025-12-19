package services

import (
	"errors"
	"strings"

	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/dto"
	"github.com/sut68/team12/backend/internal/utils"
)

type AdminProfileService interface {
	GetMeByAccountID(memberAccountID uint) (*dto.AdminProfileDTO, error)
	UpdateMeByAccountID(memberAccountID uint, req dto.UpdateAdminProfileReq) error
	SetNationalIDByAccountID(memberAccountID uint, req dto.SetAdminNationalIDReq) error
}

type adminProfileService struct {
	repo repository.AdminRepository
}

func NewAdminProfileService(repo repository.AdminRepository) AdminProfileService {
	return &adminProfileService{repo: repo}
}

func (s *adminProfileService) GetMeByAccountID(memberAccountID uint) (*dto.AdminProfileDTO, error) {
	admin, err := s.repo.GetByMemberAccountIDWithAccount(memberAccountID)
	if err != nil {
		return nil, err
	}

	phone := ""
	if admin.PhoneNumber != nil {
		phone = *admin.PhoneNumber
	}

	return &dto.AdminProfileDTO{
		ID:              admin.ID,
		Username:        admin.Username,
		FirstName:       admin.FirstName,
		LastName:        admin.LastName,
		ProfilePicture:  admin.ProfilePicture,
		PhoneNumber:     phone,
		Email:           admin.MemberAccount.Email,
	}, nil
}

func (s *adminProfileService) UpdateMeByAccountID(memberAccountID uint, req dto.UpdateAdminProfileReq) error {
	admin, err := s.repo.GetByMemberAccountIDWithAccount(memberAccountID)
	if err != nil {
		return err
	}

	patch := map[string]any{}

	if strings.TrimSpace(req.Username) != "" {
		patch["username"] = strings.TrimSpace(req.Username)
	}
	if req.FirstName != "" {
		patch["first_name"] = req.FirstName
	}
	if req.LastName != "" {
		patch["last_name"] = req.LastName
	}
	if req.ProfilePicture != "" {
		patch["profile_picture"] = req.ProfilePicture
	}
	if req.PhoneNumber != "" {
		patch["phone_number"] = req.PhoneNumber
	}

	if len(patch) == 0 {
		return errors.New("ไม่มีข้อมูลสำหรับอัปเดต")
	}

	return s.repo.UpdateProfile(admin.ID, patch)
}

func (s *adminProfileService) SetNationalIDByAccountID(memberAccountID uint, req dto.SetAdminNationalIDReq) error {
	admin, err := s.repo.GetByMemberAccountIDWithAccount(memberAccountID)
	if err != nil {
		return err
	}

	nid := utils.NormalizeNationalID(req.NationalID)
	if !utils.ValidateNationalID13(nid) {
		return errors.New("เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก")
	}

	hash := utils.HashNationalID(nid)
	last4 := utils.Last4(nid)

	return s.repo.UpdateNationalID(admin.ID, hash, last4)
}
