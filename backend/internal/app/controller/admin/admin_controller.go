package controller

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/internal/app/services"
	"github.com/sut68/team12/backend/internal/dto"
)

type AdminProfileController struct {
	svc services.AdminProfileService
}

func NewAdminProfileController(svc services.AdminProfileService) *AdminProfileController {
	return &AdminProfileController{svc: svc}
}

func (ctl *AdminProfileController) GetMe(c *gin.Context) {
	memberAccountID := c.GetUint("user_id") // ✅ จาก JWT middleware

	res, err := ctl.svc.GetMeByAccountID(memberAccountID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": res})
}

func (ctl *AdminProfileController) UpdateMe(c *gin.Context) {
	memberAccountID := c.GetUint("user_id")

	var req dto.UpdateAdminProfileReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "payload ไม่ถูกต้อง"})
		return
	}

	if err := ctl.svc.UpdateMeByAccountID(memberAccountID, req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "updated"})
}

func (ctl *AdminProfileController) SetNationalID(c *gin.Context) {
	memberAccountID := c.GetUint("user_id")

	var req dto.SetAdminNationalIDReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "payload ไม่ถูกต้อง"})
		return
	}

	if err := ctl.svc.SetNationalIDByAccountID(memberAccountID, req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "national id set"})
}
