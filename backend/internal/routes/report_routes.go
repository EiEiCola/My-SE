package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/config"
	admin_controller "github.com/sut68/team12/backend/internal/app/controller/admin"
	member_controller "github.com/sut68/team12/backend/internal/app/controller/member"
	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/app/services"
	"github.com/sut68/team12/backend/internal/middlewares"
)

func SetupReportRoutes(api *gin.RouterGroup, memberService services.MemberService) {
	db := config.DB

	// Repo & Service
	reportRepo := repository.NewReportRepository(db)
	postRepo := repository.NewPostRepository(db)
	memberRepo := repository.NewMemberRepository(db)
	reportService := services.NewReportService(db, reportRepo, postRepo)
	memberService := services.NewMemberService(memberRepo)

	// Controllers
	adminReportCtl := admin_controller.NewAdminReportController(reportService)
	memberReportCtl := member_controller.NewMemberReportController(reportService, memberService)

	// Admin Routes - Protected with JWT and Admin role check
	adminGroup := api.Group("/admin", middlewares.JWTAuthMiddleware(), middlewares.RequireAdminMiddleware())
	{
		adminGroup.GET("/reports", adminReportCtl.List)
		adminGroup.GET("/reports/:id", adminReportCtl.GetByID)
		adminGroup.POST("/reports/:id/status", adminReportCtl.UpdateStatus)
	}

	// Member Routes - Protected with JWT
	memberGroup := api.Group("/members", middlewares.JWTAuthMiddleware())
	{
		memberGroup.POST("/reports", memberReportCtl.Create)
		memberGroup.GET("/reports", memberReportCtl.List)
		memberGroup.GET("/reports/:id", memberReportCtl.GetByID)
		memberGroup.PUT("/reports/:id", memberReportCtl.Update)
		memberGroup.DELETE("/reports/:id", memberReportCtl.Delete)
	}
}
