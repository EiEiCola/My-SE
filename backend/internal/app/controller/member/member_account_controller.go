package controller

import (

    "net/http"

    "github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/internal/app/services"
)

// struct ตัวนี้คือชั้น Controller สำหรับจัดการ HTTP request ที่เกี่ยวกับ auth (register / login)
// ทำหน้าที่รับข้อมูลจาก client (frontend), เรียกใช้ AuthService, แล้วส่ง response กลับ
type AuthController struct {
    authService services.MemberAccountService
}

// ฟังก์ชันสำหรับ register route ของ auth เข้ากับ Gin engine
// รับ gin.Engine และ AuthService แล้วผูก handler ให้กับ path /api/auth/*
func NewAuthController(r *gin.Engine, authService services.MemberAccountService) {
    ctl := &AuthController{authService: authService}

    // group path พื้นฐานของ auth
    auth := r.Group("/api/auth")
    {
        // POST /api/auth/register → สมัครสมาชิกใหม่
        auth.POST("/register", ctl.Register)

        // POST /api/auth/login → ล็อกอิน
        auth.POST("/login", ctl.Login)
    }
}

// มี tag binding สำหรับ validate ข้อมูลเบื้องต้นด้วยของ Gin
type registerRequest struct {
    Email    string `json:"email" binding:"required,email"`  // ต้องมีและต้องเป็น email ที่ถูกต้อง
    Password string `json:"password" binding:"required,min=6"` // ต้องมี และขั้นต่ำ 6 ตัวอักษร
    RoleID   uint   `json:"role_id" binding:"required"`     
}

// struct สำหรับ map JSON body ตอนล็อกอิน
type loginRequest struct {
    Email    string `json:"email" binding:"required,email"`
    Password string `json:"password" binding:"required"`
}

// 1) อ่านและ validate body จาก request (bind JSON → struct)
// 2) ถ้า validate ไม่ผ่าน → ตอบ 400 พร้อม error
// 3) ถ้าผ่าน → เรียก AuthService.Register
// 4) ถ้า service error → ตอบ 400 พร้อมข้อความ error
// 5) ถ้าสำเร็จ → ตอบ 201 พร้อมข้อมูล account บางส่วนกลับไป (เช่น id, email, role)
func (ctl *AuthController) Register(c *gin.Context) {
    var req registerRequest

    if err := c.ShouldBindJSON(&req); err != nil {
        // ถ้า validate ไม่ผ่านหรือ JSON ไม่ถูก format
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    // เรียก service เพื่อไปจัดการสมัครสมาชิก
    acc, err := ctl.authService.Register(req.Email, req.Password, req.RoleID)
    if err != nil {
        // ถ้ามี error จาก service (เช่น email ซ้ำ)
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    // สมัครสำเร็จ → ตอบ 201 Created พร้อมข้อมูลที่จำเป็น
    c.JSON(http.StatusCreated, gin.H{
        "id":    acc.ID,
        "email": acc.Email,
        "role":  acc.RoleID,
    })
}

// 1) อ่านและ validate body จาก request
// 2) ถ้าข้อมูลไม่ครบ/ไม่ถูก → ตอบ 400
// 3) ถ้าครบ → เรียก AuthService.Login เพื่อตรวจสอบ email + password
// 4) ถ้าไม่ผ่าน → ตอบ 401 Unauthorized
// 5) ถ้าผ่าน → ตอบ 200 พร้อมข้อมูล user (และอนาคตอาจแนบ token ไปด้วย)
func (ctl *AuthController) Login(c *gin.Context) {
    var req loginRequest

    // Bind JSON จาก request body เข้ากับ struct loginRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    // เรียก service เช็ค email + password
    acc, err := ctl.authService.Login(req.Email, req.Password)
    if err != nil {
        // login fail เช่น email/password ไม่ถูกต้อง
        c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
        return
    }

    // login สำเร็จ → ในอนาคตอาจสร้าง JWT token ตรงนี้ด้วย
    c.JSON(http.StatusOK, gin.H{
        "id":    acc.ID,
        "email": acc.Email,
        "role":  acc.RoleID,
        // "token": token, // ไว้เพิ่มทีหลังตอนทำ JWT
    })
}
