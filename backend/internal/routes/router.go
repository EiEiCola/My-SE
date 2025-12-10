package routes

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	controller "github.com/sut68/team12/backend/internal/app/controller/admin"
	member_controller "github.com/sut68/team12/backend/internal/app/controller/member"
	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/app/services"
)

// SetupRoutes initializes all dependencies and registers all routes
func SetupRoutes(r *gin.Engine, db *gorm.DB) {
	// --- Admin / PR System Wiring ---

	// Repositories
	annRepo := repository.NewAnnouncementRepository(db)
	prSubmissionRepo := repository.NewPRSubmissionRepository(db)
	prReviewRepo := repository.NewPRReviewRepository(db)

	// Services
	annService := services.NewAnnouncementService(db, annRepo)
	prService := services.NewPRSubmissionService(db, prSubmissionRepo)
	prReviewService := services.NewPRReviewService(db, prSubmissionRepo, prReviewRepo, annRepo)

	// Controller (Admin)
	annController := controller.NewAdminAnnouncementController(annService)
	prController := controller.NewAdminPRController(prService, prReviewService)

	// Controller (Member)
	// Uses existing PRSubmissionController in member package
	memberPRController := member_controller.NewPRSubmissionController(prService)

	// Mock Authentication Middleware
	mockAdminAuth := func(c *gin.Context) {
		c.Set("admin_id", 1)
		c.Next()
	}
	mockMemberAuth := func(c *gin.Context) {
		c.Set("member_id", uint(1)) // Mock Member ID = 1
		c.Next()
	}

	// Routes Grouping
	api := r.Group("/api")
	{
		// Admin Routes
		adminGroup := api.Group("/admin", mockAdminAuth)
		{
			// Announcements
			adminGroup.GET("/announcements", annController.List)
			adminGroup.GET("/announcements/:id", annController.GetByID)
			adminGroup.POST("/announcements", annController.Create)
			adminGroup.PUT("/announcements/:id", annController.Update)
			adminGroup.DELETE("/announcements/:id", annController.Delete)

			// PR Submissions (Admin View)
			adminGroup.GET("/pr-submissions", prController.List)
			adminGroup.POST("/pr-submissions/:id/review", prController.Review)
		}

		// Member Routes
		memberGroup := api.Group("/members", mockMemberAuth)
		{
			// PR Submissions (Member Create/View Own)
			memberGroup.POST("/pr-submissions", memberPRController.Create)
			memberGroup.GET("/pr-submissions", memberPRController.List)
		}
	}
}
