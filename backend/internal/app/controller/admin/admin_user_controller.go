package controller

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/internal/app/services"
)

type AdminUserController struct {
	svc services.AdminUserService
}

func NewAdminUserController(svc services.AdminUserService) *AdminUserController {
	return &AdminUserController{svc: svc}
}

// GET /api/admin/users?email=&code=
func (ctl *AdminUserController) SearchUsers(c *gin.Context) {
	email := c.Query("email")
	code := c.Query("code")

	data, err := ctl.svc.Search(email, code)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "ค้นหาบัญชีผู้ใช้ไม่สำเร็จ",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": data})
}

type lockBody struct {
	Reason string `json:"reason"`
}

// PATCH /api/admin/users/:id/lock
func (ctl *AdminUserController) LockUser(c *gin.Context) {
	id64, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id64 == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid id"})
		return
	}

	var body lockBody
	_ = c.ShouldBindJSON(&body)

	if err := ctl.svc.Lock(uint(id64), body.Reason); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "ล็อกบัญชีไม่สำเร็จ",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "locked"})
}

// PATCH /api/admin/users/:id/unlock
func (ctl *AdminUserController) UnlockUser(c *gin.Context) {
	id64, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id64 == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"message": "invalid id"})
		return
	}

	if err := ctl.svc.Unlock(uint(id64)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "ปลดล็อกไม่สำเร็จ",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "unlocked"})
}
