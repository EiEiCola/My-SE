package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/config"
	"github.com/sut68/team12/backend/internal/app/controller"
	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/app/services/user"
)

func SetupAuthRoutes(r *gin.RouterGroup) {
	db := config.DB

	repo := repository.NewAuthRepository(db)
	svc := services.NewAuthService(db, repo)
	ctl := controller.NewAuthController(svc)

	r.POST("/register", ctl.Register)
	r.POST("/login", ctl.Login)

	// ✅ forgot password
	r.POST("/verify-reset", ctl.VerifyReset)       // POST /api/auth/verify-reset
	r.POST("/reset-password", ctl.ResetPassword)   // POST /api/auth/reset-password
}
