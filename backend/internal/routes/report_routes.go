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

func SetupReportRoutes(api *gin.RouterGroup) {
	db := config.DB

	// Repo & Service
	// Repo & Service
	reportRepo := repository.NewReportRepository(db)
	memberRepo := repository.NewMemberRepository(db)
	reportService := services.NewReportService(db, reportRepo)

	// Controllers
	adminReportCtl := admin_controller.NewAdminReportController(reportService)
	memberReportCtl := member_controller.NewMemberReportController(reportService)

	// Admin Routes
	adminGroup := api.Group("/admin", middlewares.JWTAuthMiddleware(), middlewares.RequireAdminMiddleware())
	{
		// Adapter to map user_id to admin_id
		adminGroup.Use(func(c *gin.Context) {
			if userID, exists := c.Get("user_id"); exists {
				c.Set("admin_id", userID)
			}
			c.Next()
		})
		adminGroup.GET("/reports", adminReportCtl.List)
		adminGroup.GET("/reports/:id", adminReportCtl.GetByID)
		adminGroup.POST("/reports/:id/status", adminReportCtl.UpdateStatus)
	}

	// Member Routes
	// Member Routes
	memberGroup := api.Group("/members", middlewares.JWTAuthMiddleware())
	{
		// Adapter to map user_id (AccountID) -> member_id (MemberID)
		memberGroup.Use(func(c *gin.Context) {
			userIDVal, exists := c.Get("user_id")
			if !exists {
				c.AbortWithStatusJSON(401, gin.H{"error": "Unauthorized"})
				return
			}
			userID := userIDVal.(uint)
			member, err := memberRepo.FindByAccountID(userID)
			if err != nil {
				c.AbortWithStatusJSON(401, gin.H{"error": "Member profile not found"})
				return
			}
			c.Set("member_id", member.ID)
			c.Next()
		})
		memberGroup.POST("/reports", memberReportCtl.Create)
		memberGroup.GET("/reports", memberReportCtl.List)
		memberGroup.GET("/reports/:id", memberReportCtl.GetByID)
		memberGroup.PUT("/reports/:id", memberReportCtl.Update)
		memberGroup.DELETE("/reports/:id", memberReportCtl.Delete)
	}
}
