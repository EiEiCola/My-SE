package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/config"
	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/app/services"
	controller "github.com/sut68/team12/backend/internal/app/controller/member"
)

func SetupMemberRoutes(r *gin.Engine) {
	db := config.DB 

	// repo
	memberRepo := repository.NewMemberRepository(db)
	memberAccountRepo := repository.NewMemberAccountRepository(db)

	// services
	memberService := services.NewMemberService(memberRepo)
	authService := services.NewMemberAccountService(memberAccountRepo)

	// controllers
	memberCtl := controller.NewMemberController(memberService)
	authCtl := controller.NewAuthController(authService)

	// ---------------- ROUTES HERE ---------------

	auth := r.Group("/api/auth")
	{
		auth.POST("/register", authCtl.Register)
		auth.POST("/login", authCtl.Login)
	}

	members := r.Group("/api/members")
	{
		members.GET("/account/:accountId", memberCtl.GetProfileByAccountID)
		members.PUT("/account/:accountId", memberCtl.UpdateProfileByAccountID)
	}
}
