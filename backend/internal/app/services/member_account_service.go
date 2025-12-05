package services

import (

    "errors"

    "github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/entity"

)

type AuthService interface {
    // รับ email, password และ roleID แล้วคืน MemberAccount ที่สร้างใหม่กลับมา
    Register(email, password string, roleID uint) (*entity.MemberAccount, error)

    Login(email, password string) (*entity.MemberAccount, error)
}

// พึ่งพา MemberAccountRepository ในการคุยกับฐานข้อมูล
type authService struct {
    memberAccountRepo repository.MemberAccountRepository
    
}
// รับ repository เข้ามา (dependency injection) แล้วคืนค่าเป็น AuthService ให้ชั้นอื่นใช้
func NewAuthService(memberAccountRepo repository.MemberAccountRepository) AuthService {
    return &authService{memberAccountRepo: memberAccountRepo}
}

// ฟังก์ชันช่วยสำหรับแปลงรหัสผ่านก่อนเก็บลงฐานข้อมูล
// ตอนนี้เป็น mock เฉย ๆ ยังไม่ได้ใช้ bcrypt จริง ๆ
func hashPassword(pwd string) string {
    // TODO: เปลี่ยนไปใช้ bcrypt แทนในอนาคต
    return pwd
}

// checkPassword
// ฟังก์ชันช่วยสำหรับตรวจสอบรหัสผ่านที่ผู้ใช้กรอก
// เทียบกับรหัสผ่านที่เก็บในฐานข้อมูล (ซึ่งควรจะเป็น hash)
// ตอนนี้ยังเป็นการเทียบตรง ๆ แบบ plain text
func checkPassword(plain, hashed string) bool {
    // TODO: เปลี่ยนมาใช้ bcrypt.CompareHashAndPassword
    return plain == hashed
}

// 1) เช็คก่อนว่า email นี้มีคนใช้ไปแล้วหรือยัง
// 2) ถ้ายังไม่ซ้ำ ให้ hash password แล้วสร้าง MemberAccount ใหม่
// 3) บันทึกลงฐานข้อมูลผ่าน repository
func (s *authService) Register(email, password string, roleID uint) (*entity.MemberAccount, error) {
    // 1) เช็ค email ซ้ำ โดยลองค้นจาก repo ก่อน
    if existing, _ := s.memberAccountRepo.FindByEmail(email); existing != nil {
        return nil, errors.New("email already used")
    }

    // 2) แปลง (hash) password ก่อนเก็บ
    hashed := hashPassword(password)

    // 3) สร้าง struct MemberAccount ขึ้นมาเพื่อเตรียมบันทึกลงฐานข้อมูล
    acc := &entity.MemberAccount{
        Email:    email,
        Password: hashed,
        RoleID:   roleID,
    }

    // 4) ใช้ repository ในการสร้าง record ใหม่ในฐานข้อมูล
    if err := s.memberAccountRepo.Create(acc); err != nil {
        return nil, err
    }

    // 5) ถ้าทุกอย่างผ่าน คืน account ที่สร้างสำเร็จกลับไป
    return acc, nil
}

// 1) ดึง MemberAccount จาก email
// 2) ถ้าไม่เจอ หรือรหัสผ่านไม่ตรง ให้คืน error ว่า invalid
// 3) ถ้าถูกต้อง คืน MemberAccount กลับไป
func (s *authService) Login(email, password string) (*entity.MemberAccount, error) {
    // 1) ดึงข้อมูล account จาก email ก่อน
    acc, err := s.memberAccountRepo.FindByEmail(email)
    if err != nil {
        // ไม่บอกแยกว่าผิดที่ email หรือ password เพื่อเหตุผลด้าน security
        return nil, errors.New("invalid email or password")
    }

    // 2) เช็ครหัสผ่านที่ผู้ใช้กรอก เทียบกับของที่เก็บไว้
    if !checkPassword(password, acc.Password) {
        return nil, errors.New("invalid email or password")
    }

    // 3) ถ้าทุกอย่างถูกต้อง คืน account กลับไป
    return acc, nil
}
