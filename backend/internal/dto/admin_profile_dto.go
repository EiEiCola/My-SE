package dto

// ==============================
// Response DTO
// ==============================

// ใช้ตอน GET /admin/me
type AdminProfileDTO struct {
	ID              uint   `json:"id"`
	Username        string `json:"username"`
	FirstName       string `json:"first_name"`
	LastName        string `json:"last_name"`
	ProfilePicture  string `json:"profile_picture"`
	PhoneNumber     string `json:"phone_number"`      // frontend ใช้ง่าย (ไม่เป็น pointer)
	Email           string `json:"email"`
	NationalIDLast4 string `json:"national_id_last4"`
}

// ==============================
// Request DTO
// ==============================

// ใช้ตอน PUT /admin/me
type UpdateAdminProfileReq struct {
	Username       string `json:"username"`
	FirstName      string `json:"first_name"`
	LastName       string `json:"last_name"`
	ProfilePicture string `json:"profile_picture"`
	PhoneNumber    string `json:"phone_number"`
}

// ใช้ตอน POST /admin/set-national-id
type SetAdminNationalIDReq struct {
	NationalID string `json:"national_id"`
}
