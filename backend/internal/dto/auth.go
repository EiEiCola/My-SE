package dto

type RegisterReq struct {
	Email     string `json:"email" binding:"required,email"`
	Password  string `json:"password" binding:"required,min=8"`

	Username   string `json:"username" binding:"required"`
	FirstName  string `json:"first_name" binding:"required"`
	LastName   string `json:"last_name" binding:"required"`
	Dob        string `json:"dob" binding:"required"` // ค่อย parse เป็น time.Time ใน service
	NationalID string `json:"national_id" binding:"required,len=13"`
	StudentID  string `json:"student_id" binding:"required"`
	GenderID   uint   `json:"gender_id" binding:"required"`
}

type LoginReq struct {
	Identifier string `json:"identifier"` // ✅ ใหม่: gmail หรือ student id
	Email    string `json:"email"`
	Password string `json:"password" binding:"required"`
}

type AuthRes struct {
	Token string `json:"token"`
}
