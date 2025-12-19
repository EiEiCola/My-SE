package controller

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/internal/app/services/user"
	"github.com/sut68/team12/backend/internal/dto"
)

type AuthController struct {
	svc services.AuthService
}

func NewAuthController(svc services.AuthService) *AuthController {
	return &AuthController{svc: svc}
}

func (ctl *AuthController) Register(c *gin.Context) {
	var req dto.RegisterReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	id, err := ctl.svc.Register(req)
	if err != nil {
		switch err.Error() {
		case "EMAIL_DUP":
			c.JSON(http.StatusBadRequest, gin.H{
				"field":   "email",
				"message": "This email has already been registered",
			})
			return
		case "STUDENT_ID_DUP":
			c.JSON(http.StatusBadRequest, gin.H{
				"field":   "student_id",
				"message": "This student ID has already been registered",
			})
			return
		case "NATIONAL_ID_DUP":
			c.JSON(http.StatusBadRequest, gin.H{
				"field":   "national_id",
				"message": "This national ID has already been registered",
			})
			return
		case "MEMBER_DUP":
			c.JSON(http.StatusBadRequest, gin.H{
				"message": "Duplicate data (student id / national id) already exists",
			})
			return
		default:
			c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
			return
		}
	}

	c.JSON(http.StatusCreated, gin.H{
		"data": gin.H{"id": id},
	})
}

func (ctl *AuthController) Login(c *gin.Context) {
	var req dto.LoginReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	token, err := ctl.svc.Login(req)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": dto.AuthRes{Token: token},
	})
}

// -------------------- forgot password --------------------

type VerifyResetReq struct {
	Identifier string `json:"identifier"`
	NationalID string `json:"national_id"`
}

func (ctl *AuthController) VerifyReset(c *gin.Context) {
	var req VerifyResetReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	resetToken, err := ctl.svc.VerifyResetIdentity(req.Identifier, req.NationalID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{"reset_token": resetToken},
	})
}

type ResetPasswordReq struct {
	ResetToken  string `json:"reset_token"`
	NewPassword string `json:"new_password"`
}

func (ctl *AuthController) ResetPassword(c *gin.Context) {
	var req ResetPasswordReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	if err := ctl.svc.ResetPassword(req.ResetToken, req.NewPassword); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "password updated"})
}
