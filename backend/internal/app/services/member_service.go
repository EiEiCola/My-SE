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

    // UpdateProfile แก้ไขข้อมูลโปรไฟล์ตาม accountID
    UpdateProfile(accountID uint, input UpdateProfileInput) (*entity.Member, error)
}

// struct สำหรับรับข้อมูลจาก controller (หรือ mapping จาก request) เพื่ออัปเดตโปรไฟล์
type UpdateProfileInput struct {
    FirstName string `json:"first_name"`
    LastName  string `json:"last_name"`
    Username  string `json:"username"`
    Bio       string `json:"bio"`
    Dob       string `json:"dob"`
    GenderID  uint   `json:"gender_id"`
}

type memberService struct {
    memberRepo repository.MemberRepository
}

func NewMemberService(memberRepo repository.MemberRepository) MemberService {
    return &memberService{memberRepo: memberRepo}
}

// ดึงข้อมูลโปรไฟล์จาก accountID (เอาไว้ใช้กับ /me ทีหลัง)
func (s *memberService) GetProfileByAccountID(accountID uint) (*entity.Member, error) {
    return s.memberRepo.FindByAccountID(accountID)
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

    dobTime, err := time.Parse("2006-01-02", input.Dob) // input.Dob เป็น string
    if err != nil {
    // ถ้าใช้ gin อยู่ ตัวอย่างจัดการ error:
    // c.JSON(http.StatusBadRequest, gin.H{"error": "invalid dob format"})
    // return
}
    m.Dob      = dobTime 
    m.GenderID = input.GenderID

    // บันทึกลงฐานข้อมูล
    if err := s.memberRepo.Update(m); err != nil {
        return nil, err
    }

    return m, nil
}
