package controller

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/internal/app/services"
)

// controller สำหรับจัดการ endpoint เกี่ยวกับโปรไฟล์ผู้ใช้ (Member)
type MemberController struct {
	memberService services.MemberService
}

// register route ที่เกี่ยวกับ member/profile
func NewMemberController(memberService services.MemberService) *MemberController {
	return &MemberController{memberService: memberService}
}

// struct สำหรับแปลงข้อมูลโปรไฟล์ก่อนส่งกลับไปให้ frontend
type getProfileResponse struct {
	ID            uint   `json:"id"`
	FirstName     string `json:"first_name"`
	LastName      string `json:"last_name"`
	Username      string `json:"username"`
	Bio           string `json:"bio"`
	Dob           string `json:"dob"`

	Email         string `json:"email"`
	Gender        string `json:"gender"`
	GenderID      uint   `json:"gender_id"`
	Status        string `json:"active_status"`
	StudentID     string `json:"student_id"`
	NationalID    string `json:"national_id"`
	MemberPicture string `json:"member_picture"`
}

// struct สำหรับรับ body ตอนแก้ไขโปรไฟล์
type updateProfileRequest struct {
	FirstName     string `json:"first_name" binding:"required"`
	LastName      string `json:"last_name" binding:"required"`
	Username      string `json:"username" binding:"required"`
	Bio           string `json:"bio"`
	Dob           string `json:"dob"`
	GenderID      uint   `json:"gender_id" binding:"required"`
	MemberPicture string `json:"member_picture"`
}

// handler สำหรับ GET /api/members/account/:accountId
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
		Dob:           m.Dob.Format("2006-01-02"), // time.Time -> string
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

// handler สำหรับ PUT /api/members/account/:accountId
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
		Dob:           req.Dob, // string -> ไป parse เป็น time.Time ใน service
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
