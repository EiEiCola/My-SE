package controller

import (
	
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/internal/app/services"
)

type AuthController struct {
	authService services.AuthService
}

func NewAuthController(authService services.AuthService) *AuthController {
	return &AuthController{authService}
}

// REGISTER
func (ctl *AuthController) Register(c *gin.Context) {

	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
		RoleID   uint   `json:"role_id"`
	}

	// Validate JSON input
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Call service layer
	account, err := ctl.authService.Register(req.Email, req.Password, req.RoleID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "register success",
		"account": account,
	})
}

// LOGIN
func (ctl *AuthController) Login(c *gin.Context) {

	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	// Validate JSON body
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	// Call service layer
	account, err := ctl.authService.Login(req.Email, req.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":        "login success",
		"member_account": account,
	})
}
