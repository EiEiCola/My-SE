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

	// Mock Admin Auth (for testing without JWT)
	mockAdminAuth := func(c *gin.Context) {
		c.Set("admin_id", uint(1))
		c.Next()
	}

	// Admin Routes
	adminGroup := api.Group("/admin", mockAdminAuth)
	{
		adminGroup.GET("/reports", adminReportCtl.List)
		adminGroup.GET("/reports/:id", adminReportCtl.GetByID)
		adminGroup.POST("/reports/:id/status", adminReportCtl.UpdateStatus)
	}

	// Mock Member Auth (for testing without JWT)
	mockMemberAuth := func(c *gin.Context) {
		c.Set("member_id", uint(1))
		c.Next()
	}

	// Member Routes
	memberGroup := api.Group("/members", mockMemberAuth)
	{
		memberGroup.POST("/reports", memberReportCtl.Create)
		memberGroup.GET("/reports", memberReportCtl.List)
		memberGroup.GET("/reports/:id", memberReportCtl.GetByID)
		memberGroup.PUT("/reports/:id", memberReportCtl.Update)
		memberGroup.DELETE("/reports/:id", memberReportCtl.Delete)
	}
}
