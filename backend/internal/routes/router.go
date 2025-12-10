package routes

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	controller "github.com/sut68/team12/backend/internal/app/controller/admin"
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

	// Controllers
	annController := controller.NewAdminAnnouncementController(annService)
	prController := controller.NewAdminPRController(prService, prReviewService)

	// Mock Authentication Middleware (puts admin_id=1 in context)
	// In production, this would be a real auth middleware
	mockAuth := func(c *gin.Context) {
		c.Set("admin_id", 1)
		c.Next()
	}

	// Routes Grouping
	api := r.Group("/api")
	{
		// Admin Routes
		adminGroup := api.Group("/admin", mockAuth)
		{
			// Announcements
			adminGroup.GET("/announcements", annController.List)
			adminGroup.GET("/announcements/:id", annController.GetByID)
			adminGroup.POST("/announcements", annController.Create)
			adminGroup.PUT("/announcements/:id", annController.Update)
			adminGroup.DELETE("/announcements/:id", annController.Delete)

			// PR Submissions
			adminGroup.GET("/pr-submissions", prController.List)
			adminGroup.POST("/pr-submissions/:id/review", prController.Review)
		}
	}
}
