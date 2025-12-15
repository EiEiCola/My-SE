package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/config"

	member_controller "github.com/sut68/team12/backend/internal/app/controller/member"
	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/app/services"
)

// SetupReviewRoutes registers all routes related to Review system
func SetupReviewRoutes(api *gin.RouterGroup) {
	db := config.DB

	// Repository
	reviewRepo := repository.NewReviewRepository(db)
	// Service
	reviewService := services.NewReviewService(reviewRepo)
	// Controller
	reviewController := member_controller.NewReviewController(reviewService)

	// Mock Member Auth
	mockMemberAuth := func(c *gin.Context) {
		c.Set("member_id", uint(1)) // mock member id
		c.Next()
	}

	// Member Review Routes
	memberGroup := api.Group("/member", mockMemberAuth)
	{
		// ✅ Create Review List Vote
		memberGroup.POST("/reviews", reviewController.CreateReview)
		memberGroup.GET("/reviews", reviewController.ListReviews)
		memberGroup.DELETE("/reviews/:id", reviewController.DeleteReview)
		memberGroup.POST("/reviews/:id/images", reviewController.UploadReviewImages)	
		memberGroup.POST("/reviews/:id/vote", reviewController.VoteReview)

	}
}
