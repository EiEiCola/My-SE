package controller

import (
	"net/http"

	"github.com/gin-gonic/gin"
	user "github.com/sut68/team12/backend/internal/app/services/user"
)

type ResetController struct {
	resetService user.ResetService
}

func NewResetController(resetService user.ResetService) *ResetController {
	return &ResetController{resetService}
}

func (ctl *ResetController) VerifyIdentity(c *gin.Context) {

	var req struct {
		Identifier string `json:"identifier"`
		NationalID string `json:"national_id"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	accountID, err := ctl.resetService.Verify(req.Identifier, req.NationalID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":           true,
		"member_account_id": accountID,
	})
}

func (ctl *ResetController) ResetPassword(c *gin.Context) {

	var req struct {
		AccountID   uint   `json:"account_id"`
		NewPassword string `json:"new_password"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	if req.NewPassword == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "password cannot be empty"})
		return
	}

	if err := ctl.resetService.ResetPassword(req.AccountID, req.NewPassword); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "reset failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "password updated",
	})
}
