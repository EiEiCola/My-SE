package controller

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/internal/app/services"
)

// controller สำหรับจัดการ endpoint เกี่ยวกับโปรไฟล์ผู้ใช้
type MemberController struct {
	memberService services.MemberService
}

func NewMemberController(memberService services.MemberService) *MemberController {
	return &MemberController{memberService: memberService}
}

type getProfileResponse struct {
	ID        uint   `json:"id"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Username  string `json:"username"`
	Bio       string `json:"bio"`
	Dob       string `json:"dob"`

	Email         string `json:"email"`
	Gender        string `json:"gender"`
	GenderID      uint   `json:"gender_id"`
	Status        string `json:"active_status"`
	StudentID     string `json:"student_id"`
	NationalID    string `json:"national_id"`
	MemberPicture string `json:"member_picture"`
}

type updateProfileRequest struct {
	FirstName     string `json:"first_name" binding:"required"`
	LastName      string `json:"last_name" binding:"required"`
	Username      string `json:"username" binding:"required"`
	Bio           string `json:"bio"`
	Dob           string `json:"dob"`
	GenderID      uint   `json:"gender_id" binding:"required"`
	MemberPicture string `json:"member_picture"`
}

// ------------------------------
// ✅ GET /api/member/me
// ✅ IMPORTANT: JWT user_id = member_account_id (จาก Login: SignToken(acc.ID, role))
// ------------------------------
func (ctl *MemberController) GetMe(c *gin.Context) {
	accountID := c.GetUint("user_id")
	if accountID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing/invalid user_id"})
		return
	}

	// ✅ FIX: ต้องดึง member ด้วย member_account_id
	m, err := ctl.memberService.GetProfileByAccountID(accountID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	res := getProfileResponse{
		ID:            m.ID,
		FirstName:     m.FirstName,
		LastName:      m.LastName,
		Username:      m.Username,
		Bio:           m.Bio,
		Dob:           m.Dob.Format("2006-01-02"),
		Email:         m.MemberAccount.Email,
		Gender:        m.Gender.GenderName,
		GenderID:      m.GenderID,
		Status:        m.ActiveStatus.ActiveStatusName,
		StudentID:     m.StudentID,
		NationalID:    m.NationalID,
		MemberPicture: m.MemberPicture,
	}

	c.JSON(http.StatusOK, res)
}

// ------------------------------
// ✅ PUT /api/member/me
// ✅ IMPORTANT: JWT user_id = member_account_id
// ------------------------------
func (ctl *MemberController) UpdateMe(c *gin.Context) {
	accountID := c.GetUint("user_id")
	if accountID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing/invalid user_id"})
		return
	}

	var req updateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	input := services.UpdateProfileInput{
		FirstName:     req.FirstName,
		LastName:      req.LastName,
		Username:      req.Username,
		Bio:           req.Bio,
		Dob:           req.Dob,
		GenderID:      req.GenderID,
		MemberPicture: req.MemberPicture,
	}

	// ✅ FIX: update โดย account id (member_account_id)
	// หมายเหตุ: service.UpdateProfile(...) ในโปรเจกต์นี้ถูกใช้กับ accountId อยู่แล้ว (ดูจาก UpdateProfileByAccountID ด้านล่าง)
	m, err := ctl.memberService.UpdateProfile(accountID, input)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":             m.ID,
		"first_name":     m.FirstName,
		"last_name":      m.LastName,
		"username":       m.Username,
		"bio":            m.Bio,
		"dob":            m.Dob.Format("2006-01-02"),
		"gender_id":      m.GenderID,
		"member_picture": m.MemberPicture,
	})
}

// ------------------------------
// เดิม: GET /api/members/account/:accountId
// ------------------------------
func (ctl *MemberController) GetProfileByAccountID(c *gin.Context) {
	accountIDParam := c.Param("accountId")

	accountIDUint, err := strconv.ParseUint(accountIDParam, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid account id"})
		return
	}

	m, err := ctl.memberService.GetProfileByAccountID(uint(accountIDUint))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	res := getProfileResponse{
		ID:            m.ID,
		FirstName:     m.FirstName,
		LastName:      m.LastName,
		Username:      m.Username,
		Bio:           m.Bio,
		Dob:           m.Dob.Format("2006-01-02"),
		Email:         m.MemberAccount.Email,
		Gender:        m.Gender.GenderName,
		GenderID:      m.GenderID,
		Status:        m.ActiveStatus.ActiveStatusName,
		StudentID:     m.StudentID,
		NationalID:    m.NationalID,
		MemberPicture: m.MemberPicture,
	}

	c.JSON(http.StatusOK, res)
}

// ------------------------------
// เดิม: PUT /api/members/account/:accountId
// ------------------------------
func (ctl *MemberController) UpdateProfileByAccountID(c *gin.Context) {
	accountIDParam := c.Param("accountId")

	accountIDUint, err := strconv.ParseUint(accountIDParam, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid account id"})
		return
	}

	var req updateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	input := services.UpdateProfileInput{
		FirstName:     req.FirstName,
		LastName:      req.LastName,
		Username:      req.Username,
		Bio:           req.Bio,
		Dob:           req.Dob,
		GenderID:      req.GenderID,
		MemberPicture: req.MemberPicture,
	}

	m, err := ctl.memberService.UpdateProfile(uint(accountIDUint), input)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":             m.ID,
		"first_name":     m.FirstName,
		"last_name":      m.LastName,
		"username":       m.Username,
		"bio":            m.Bio,
		"dob":            m.Dob.Format("2006-01-02"),
		"gender_id":      m.GenderID,
		"member_picture": m.MemberPicture,
	})
}
