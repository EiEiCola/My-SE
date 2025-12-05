package controller

import (

	"net/http"
	"strconv"

	"github.com/sut68/team12/backend/internal/entity"
	"github.com/sut68/team12/backend/internal/app/services"

	"github.com/gin-gonic/gin"
)

// ทำหน้าที่รับ HTTP request → เรียก service → ส่ง response กลับ
type AdminController struct {
	adminService services.AdminService
}

// ฟังก์ชันสำหรับ register route ที่เกี่ยวกับ admin เข้ากับ Gin router
func NewAdminController(r *gin.Engine, adminService services.AdminService) {
	ctl := &AdminController{adminService: adminService}

	admin := r.Group("/api/admins")
	{
		// GET /api/admins → ดึงรายชื่อ admin ทั้งหมด
		admin.GET("", ctl.List)

		// GET /api/admins/:id → ดึงข้อมูล admin ตาม id
		admin.GET("/:id", ctl.GetByID)

		// POST /api/admins → สร้าง admin ใหม่
		admin.POST("", ctl.Create)

		// PUT /api/admins/:id → แก้ไขชื่อ/นามสกุล admin
		admin.PUT("/:id", ctl.Update)
	}
}

// struct สำหรับ map ข้อมูล admin ก่อนส่งออกไปให้ frontend
type adminResponse struct {
	ID              uint   `json:"id"`
	AdminID         int    `json:"admin_id"`
	FirstName       string `json:"first_name"`
	LastName        string `json:"last_name"`
	MemberAccountID uint   `json:"member_account_id"`
	Email           string `json:"email"` // มาจาก MemberAccount
}

// body ที่ใช้ตอนสร้าง admin ใหม่ (POST /api/admins)
type createAdminRequest struct {
	AdminID         int    `json:"admin_id" binding:"required"`
	FirstName       string `json:"first_name" binding:"required"`
	LastName        string `json:"last_name" binding:"required"`
	MemberAccountID uint   `json:"member_account_id" binding:"required"`
}

// body ที่ใช้ตอนแก้ไขข้อมูล admin (PUT /api/admins/:id)
type updateAdminRequest struct {
	FirstName string `json:"first_name" binding:"required"`
	LastName  string `json:"last_name" binding:"required"`
}

// helper function: แปลง entity.Admin → adminResponse
func toAdminResponse(a *entity.Admin) adminResponse {
	return adminResponse{
		ID:              a.ID,
		AdminID:         a.AdminID,
		FirstName:       a.FirstName,
		LastName:        a.LastName,
		MemberAccountID: a.MemberAccountID,
		Email:           a.MemberAccount.Email,
	}
}

// handler สำหรับ GET /api/admins
// ดึง admin ทั้งหมด แล้วส่งกลับเป็น array ของ adminResponse
func (ctl *AdminController) List(c *gin.Context) {
	admins, err := ctl.adminService.ListAdmins()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	res := make([]adminResponse, 0, len(admins))
	for _, a := range admins {
		res = append(res, toAdminResponse(&a))
	}

	c.JSON(http.StatusOK, res)
}

// handler สำหรับ GET /api/admins/:id
// แปลง path param → uint → เรียก service.GetByID → ส่ง adminResponse กลับ
func (ctl *AdminController) GetByID(c *gin.Context) {
	idParam := c.Param("id")

	idUint64, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	admin, err := ctl.adminService.GetByID(uint(idUint64))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, toAdminResponse(admin))
}

// handler สำหรับ POST /api/admins
// รับ JSON body → validate → map ไปเป็น CreateAdminInput → เรียก service.CreateAdmin
func (ctl *AdminController) Create(c *gin.Context) {
	var req createAdminRequest

	// bind JSON + validate จาก tag binding
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	input := services.CreateAdminInput{
		AdminID:         req.AdminID,
		FirstName:       req.FirstName,
		LastName:        req.LastName,
		MemberAccountID: req.MemberAccountID,
	}

	admin, err := ctl.adminService.CreateAdmin(input)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, toAdminResponse(admin))
}

// handler สำหรับ PUT /api/admins/:id
// แก้ไขชื่อ/นามสกุล admin
func (ctl *AdminController) Update(c *gin.Context) {
	idParam := c.Param("id")

	idUint64, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var req updateAdminRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	input := services.UpdateAdminInput{
		FirstName: req.FirstName,
		LastName:  req.LastName,
	}

	admin, err := ctl.adminService.UpdateAdminProfile(uint(idUint64), input)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, toAdminResponse(admin))
}
