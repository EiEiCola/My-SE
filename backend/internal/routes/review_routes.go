package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/config"

	member_controller "github.com/sut68/team12/backend/internal/app/controller/member"
	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/app/services"
	"github.com/sut68/team12/backend/internal/middlewares"
)

// =======================
// Public: /api/reviews
// =======================
func SetupPublicReviewRoutes(api *gin.RouterGroup) {
	db := config.DB

	reviewRepo := repository.NewReviewRepository(db)

	// ✅ ส่ง pointSvc = nil (public list ไม่ให้แต้ม)
	reviewService := services.NewReviewService(reviewRepo, nil)

	reviewController := member_controller.NewReviewController(reviewService)

	api.GET("/reviews", reviewController.ListReviews)
}

// =======================
// Member: /api/member/reviews
// =======================
func SetupMemberReviewRoutes(memberAPI *gin.RouterGroup) {
	db := config.DB

	reviewGroup := memberAPI.Group("")
	reviewGroup.Use(middlewares.RequireMemberReviewMiddleware())

	reviewRepo := repository.NewReviewRepository(db)

	// ⭐ POINT SYSTEM
	pointSvc := services.NewPointService(db)

	reviewService := services.NewReviewService(reviewRepo, pointSvc)
	reviewController := member_controller.NewReviewController(reviewService)

	reviewGroup.POST("/reviews", reviewController.CreateReview)
	reviewGroup.GET("/reviews", reviewController.ListReviews)

	reviewGroup.GET("/reviews/my", reviewController.ListMyReviews)

	reviewGroup.DELETE("/reviews/:id", reviewController.DeleteReview)
	reviewGroup.POST("/reviews/:id/images", reviewController.UploadReviewImages)
	reviewGroup.POST("/reviews/:id/vote", reviewController.VoteReview)
}
