package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/config"
	controller "github.com/sut68/team12/backend/internal/app/controller/admin"
	member_controller "github.com/sut68/team12/backend/internal/app/controller/member"
	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/app/services"
)

// SetupPRRoutes registers all routes related to the PR/Announcement system
// It accepts a RouterGroup (e.g. /api) and appends admin/member routes to it
func SetupPRRoutes(api *gin.RouterGroup) {
	db := config.DB

	annRepo := repository.NewAnnouncementRepository(db)
	prSubmissionRepo := repository.NewPRSubmissionRepository(db)
	prReviewRepo := repository.NewPRReviewRepository(db)

	annService := services.NewAnnouncementService(db, annRepo)
	prService := services.NewPRSubmissionService(db, prSubmissionRepo)
	prReviewService := services.NewPRReviewService(db, prSubmissionRepo, prReviewRepo, annRepo)

	annController := controller.NewAdminAnnouncementController(annService)
	prController := controller.NewAdminPRController(prService, prReviewService)
	memberPRController := member_controller.NewPRSubmissionController(prService)

	// Mock Admin Auth
	mockAdminAuth := func(c *gin.Context) {
		c.Set("admin_id", 1)
		c.Next()
	}

	adminGroup := api.Group("/admin", mockAdminAuth)
	{
		// Announcements Management
		adminGroup.GET("/announcements", annController.List)
		adminGroup.GET("/announcements/:id", annController.GetByID)
		adminGroup.POST("/announcements", annController.Create)
		adminGroup.PUT("/announcements/:id", annController.Update)
		adminGroup.DELETE("/announcements/:id", annController.Delete)

		// PR Submissions Review
		adminGroup.GET("/pr-submissions", prController.List)
		adminGroup.GET("/pr-submissions/:id", prController.GetByID)
		adminGroup.PUT("/pr-submissions/:id", prController.Update) // Register Update
		adminGroup.POST("/pr-submissions/:id/review", prController.Review)
		adminGroup.DELETE("/pr-submissions/:id", prController.Delete)
	}

	// Mock Member Auth
	mockMemberAuth := func(c *gin.Context) {
		c.Set("member_id", uint(1)) // Mock Member ID = 1
		c.Next()
	}

	memberAnnController := member_controller.NewMemberAnnouncementController(annService) // Use member_controller alias

	memberGroup := api.Group("/members", mockMemberAuth)
	{
		// PR Submissions (Create/List Own)
		memberGroup.POST("/pr-submissions", memberPRController.Create)
		memberGroup.GET("/pr-submissions", memberPRController.List)

		// View Announcements
		memberGroup.GET("/announcements/:id", memberAnnController.GetByID)
		memberGroup.GET("/announcements", memberAnnController.List)
	}
}
