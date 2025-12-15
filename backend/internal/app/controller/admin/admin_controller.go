package controller

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/internal/app/services"
)

type AdminProfileController struct {
	svc services.AdminProfileService
}

func NewAdminProfileController(svc services.AdminProfileService) *AdminProfileController {
	return &AdminProfileController{svc: svc}
}

// mock auth: ใช้ X-Admin-ID ถ้าไม่มีให้ใช้ 1
func getMockAdminID(c *gin.Context) uint {
	h := c.GetHeader("X-Admin-ID")
	if h == "" {
		return 1
	}
	n, err := strconv.Atoi(h)
	if err != nil || n <= 0 {
		return 1
	}
	return uint(n)
}

func (ctl *AdminProfileController) GetMe(c *gin.Context) {
	adminID := getMockAdminID(c)

	dto, err := ctl.svc.GetMe(adminID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": dto})
}

func (ctl *AdminProfileController) UpdateMe(c *gin.Context) {
	adminID := getMockAdminID(c)

	var req services.UpdateAdminProfileReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "payload ไม่ถูกต้อง"})
		return
	}

	if err := ctl.svc.UpdateMe(adminID, req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "updated"})
}

func (ctl *AdminProfileController) SetNationalID(c *gin.Context) {
	adminID := getMockAdminID(c)

	var req services.SetAdminNationalIDReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "payload ไม่ถูกต้อง"})
		return
	}

	if err := ctl.svc.SetNationalID(adminID, req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "national id set"})
}
