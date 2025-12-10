package routes

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	controller "github.com/sut68/team12/backend/internal/app/controller/admin"
	member_controller "github.com/sut68/team12/backend/internal/app/controller/member"
)

// SetupRoutes initializes routes with injected dependencies
func SetupRoutes(r *gin.Engine, db *gorm.DB,
	annController *controller.AdminAnnouncementController,
	prController *controller.AdminPRController,
	memberPRController *member_controller.PRSubmissionController,
) {

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
