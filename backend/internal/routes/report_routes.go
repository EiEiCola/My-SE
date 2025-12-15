package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/config"
	admin_controller "github.com/sut68/team12/backend/internal/app/controller/admin"
	member_controller "github.com/sut68/team12/backend/internal/app/controller/member"
	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/app/services"
)

func SetupReportRoutes(api *gin.RouterGroup) {
	db := config.DB

	// Repo & Service
	reportRepo := repository.NewReportRepository(db)
	reportService := services.NewReportService(db, reportRepo)

	// Controllers
	adminReportCtl := admin_controller.NewAdminReportController(reportService)
	memberReportCtl := member_controller.NewMemberReportController(reportService)

	// Admin Routes
	// Mock Admin Auth
	mockAdminAuth := func(c *gin.Context) {
		c.Set("admin_id", 1)
		c.Next()
	}
	adminGroup := api.Group("/admin", mockAdminAuth)
	{
		adminGroup.GET("/reports", adminReportCtl.List)
		adminGroup.GET("/reports/:id", adminReportCtl.GetByID)
		adminGroup.POST("/reports/:id/status", adminReportCtl.UpdateStatus)
	}

	// Member Routes
	// Mock Member Auth
	mockMemberAuth := func(c *gin.Context) {
		c.Set("member_id", uint(1)) // Mock Member ID = 1
		c.Next()
	}
	memberGroup := api.Group("/members", mockMemberAuth)
	{
		memberGroup.POST("/reports", memberReportCtl.Create)
		memberGroup.GET("/reports", memberReportCtl.List)
		memberGroup.GET("/reports/:id", memberReportCtl.GetByID)
	}
}
