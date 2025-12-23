package services

import (
	"time"

	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/entity"
)

// service สำหรับจัดการ logic ที่เกี่ยวข้องกับโปรไฟล์ผู้ใช้ (Member)
type MemberService interface {
	// GetProfileByAccountID ดึงโปรไฟล์จาก MemberAccountID
	GetProfileByAccountID(accountID uint) (*entity.Member, error)

	// GetProfileByID ดึงโปรไฟล์จาก Member ID โดยตรง
	GetProfileByID(memberID uint) (*entity.Member, error)

	// UpdateProfile แก้ไขข้อมูลโปรไฟล์ตาม accountID
	UpdateProfile(accountID uint, input UpdateProfileInput) (*entity.Member, error)

	// UpdateProfileByID แก้ไขข้อมูลโปรไฟล์ตาม memberID
	UpdateProfileByID(memberID uint, input UpdateProfileInput) (*entity.Member, error)
}

// struct สำหรับรับข้อมูลจาก controller (หรือ mapping จาก request) เพื่ออัปเดตโปรไฟล์
type UpdateProfileInput struct {
	FirstName     string `json:"first_name"`
	LastName      string `json:"last_name"`
	Username      string `json:"username"`
	Bio           string `json:"bio"`
	Dob           string `json:"dob"`
	GenderID      uint   `json:"gender_id"`
	MemberPicture string `json:"member_picture"`
}

type memberService struct {
	memberRepo repository.MemberRepository
}

func NewMemberService(memberRepo repository.MemberRepository) MemberService {
	return &memberService{memberRepo: memberRepo}
}

// ดึงข้อมูลโปรไฟล์จาก accountID (เอาไว้ใช้กับ/me ทีหลัง)
func (s *memberService) GetProfileByAccountID(accountID uint) (*entity.Member, error) {
	return s.memberRepo.FindByAccountID(accountID)
}

// ดึงข้อมูลโปรไฟล์จาก memberID โดยตรง
func (s *memberService) GetProfileByID(memberID uint) (*entity.Member, error) {
	return s.memberRepo.FindByID(memberID)
}

// แก้ไขข้อมูลโปรไฟล์ของผู้ใช้ โดยอิงจาก accountID
func (s *memberService) UpdateProfile(accountID uint, input UpdateProfileInput) (*entity.Member, error) {
	m, err := s.memberRepo.FindByAccountID(accountID)
	if err != nil {
		return nil, err
	}

	// อัปเดต field ต่าง ๆ ตาม input
	m.FirstName = input.FirstName
	m.LastName = input.LastName
	m.Username = input.Username
	m.Bio = input.Bio

	// แปลง dob string -> time.Time
	if input.Dob != "" {
		dobTime, err := time.Parse("2006-01-02", input.Dob)
		if err != nil {
			return nil, err
		}
		m.Dob = dobTime
	}

	m.GenderID = input.GenderID

	// อัปเดตรูปจาก frontend ทับไปเลย (ถ้า front ไม่เปลี่ยนรูป จะส่งรูปเดิมกลับมา)
	m.MemberPicture = input.MemberPicture

	// บันทึกลงฐานข้อมูล
	if err := s.memberRepo.Update(m); err != nil {
		return nil, err
	}

	return m, nil
}

// แก้ไขข้อมูลโปรไฟล์ของผู้ใช้ โดยอิงจาก memberID
func (s *memberService) UpdateProfileByID(memberID uint, input UpdateProfileInput) (*entity.Member, error) {
	m, err := s.memberRepo.FindByID(memberID)
	if err != nil {
		return nil, err
	}

	// อัปเดต field ต่าง ๆ ตาม input
	m.FirstName = input.FirstName
	m.LastName = input.LastName
	m.Username = input.Username
	m.Bio = input.Bio

	// แปลง dob string -> time.Time
	if input.Dob != "" {
		dobTime, err := time.Parse("2006-01-02", input.Dob)
		if err != nil {
			return nil, err
		}
		m.Dob = dobTime
	}

	m.GenderID = input.GenderID
	m.MemberPicture = input.MemberPicture

	// บันทึกลงฐานข้อมูล
	if err := s.memberRepo.Update(m); err != nil {
		return nil, err
	}

	return m, nil
}
