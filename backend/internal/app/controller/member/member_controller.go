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
func NewMemberController(r *gin.Engine, memberService services.MemberService) {
    ctl := &MemberController{memberService: memberService}

    member := r.Group("/api/members")
    {
        // GET /api/members/account/:accountId → ดึงโปรไฟล์จาก accountID
        member.GET("/account/:accountId", ctl.GetProfileByAccountID)

        // PUT /api/members/account/:accountId → แก้ไขโปรไฟล์จาก accountID
        member.PUT("/account/:accountId", ctl.UpdateProfileByAccountID)
    }
}

// struct สำหรับแปลงข้อมูลโปรไฟล์ก่อนส่งกลับไปให้ frontend
type getProfileResponse struct {
    ID        uint   `json:"id"`
    FirstName string `json:"first_name"`
    LastName  string `json:"last_name"`
    Username  string `json:"username"`
    Bio       string `json:"bio"`
    Dob       string `json:"dob"`

    Email  string `json:"email"`
    Gender string `json:"gender"`
    Status string `json:"active_status"`
}

// struct สำหรับรับ body ตอนแก้ไขโปรไฟล์
type updateProfileRequest struct {
    FirstName string `json:"first_name" binding:"required"`
    LastName  string `json:"last_name" binding:"required"`
    Username  string `json:"username" binding:"required"`
    Bio       string `json:"bio"`
    Dob       string `json:"dob"`
    GenderID  uint   `json:"gender_id" binding:"required"`
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
        ID:        m.ID,
        FirstName: m.FirstName,
        LastName:  m.LastName,
        Username:  m.Username,
        Bio:       m.Bio,
        Dob:       m.Dob,
        Email:     m.MemberAccount.Email,
        Gender:    m.Gender.GenderName,
        Status:    m.ActiveStatus.ActiveStatusName,
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
        FirstName: req.FirstName,
        LastName:  req.LastName,
        Username:  req.Username,
        Bio:       req.Bio,
        Dob:       req.Dob,
        GenderID:  req.GenderID,
    }

    m, err := ctl.memberService.UpdateProfile(uint(accountIDUint), input)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "id":        m.ID,
        "first_name": m.FirstName,
        "last_name":  m.LastName,
        "username":   m.Username,
        "bio":        m.Bio,
        "dob":        m.Dob,
        "gender_id":  m.GenderID,
    })
}
