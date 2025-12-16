// backend/internal/service/admin_profile_service.go
package services

import (
  "errors"
  "strings"

  "github.com/sut68/team12/backend/internal/app/repository"
  "github.com/sut68/team12/backend/internal/utils"
)

type AdminProfileDTO struct {
  ID             uint   `json:"id"`
  Username       string `json:"username"`
  FirstName      string `json:"first_name"`
  LastName       string `json:"last_name"`
  ProfilePicture string `json:"profile_picture"`
  PhoneNumber    string `json:"phone_number"`
  Email          string `json:"email"`
  NationalIDLast4 string `json:"national_id_last4"`
}

type UpdateAdminProfileReq struct {
  Username       string `json:"username"`
  FirstName      string `json:"first_name"`
  LastName       string `json:"last_name"`
  ProfilePicture string `json:"profile_picture"`
  PhoneNumber    string `json:"phone_number"`
}

type SetAdminNationalIDReq struct {
  NationalID string `json:"national_id"`
}

type AdminProfileService interface {
  GetMe(adminID uint) (*AdminProfileDTO, error)
  UpdateMe(adminID uint, req UpdateAdminProfileReq) error
  SetNationalID(adminID uint, req SetAdminNationalIDReq) error
}

type adminProfileService struct {
  repo repository.AdminRepository
}

func NewAdminProfileService(repo repository.AdminRepository) AdminProfileService {
  return &adminProfileService{repo: repo}
}

func (s *adminProfileService) GetMe(adminID uint) (*AdminProfileDTO, error) {
  admin, err := s.repo.GetByIDWithAccount(adminID)
  if err != nil {
    return nil, err
  }

  dto := &AdminProfileDTO{
    ID:             admin.ID,
    Username:       admin.Username,
    FirstName:      admin.FirstName,
    LastName:       admin.LastName,
    ProfilePicture: admin.ProfilePicture,
    PhoneNumber:    admin.PhoneNumber,
    NationalIDLast4: admin.NationalIDLast4,
    Email:          admin.MemberAccount.Email,
  }
  return dto, nil
}

func (s *adminProfileService) UpdateMe(adminID uint, req UpdateAdminProfileReq) error {
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
  return s.repo.UpdateProfile(adminID, patch)
}

func (s *adminProfileService) SetNationalID(adminID uint, req SetAdminNationalIDReq) error {
  nid := utils.NormalizeNationalID(req.NationalID)
  if !utils.ValidateNationalID13(nid) {
    return errors.New("เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก")
  }

  hash := utils.HashNationalID(nid)
  last4 := utils.Last4(nid)
  return s.repo.UpdateNationalID(adminID, hash, last4)
}
