package dto

type AdminUserAccountDTO struct {
	ID       uint   `json:"id"`
	Username string `json:"username"`
	Email    string `json:"email"`
	Code     string `json:"code"`       // student_id / student_code / member_code
	IsLocked bool   `json:"is_locked"`  // ✅ ใช้ตัวนี้เป็นหลัก
}
