package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/config"

	member_controller "github.com/sut68/team12/backend/internal/app/controller/member"
	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/app/services"
	"github.com/sut68/team12/backend/internal/middlewares"
)
func SetupReviewRoutes(memberAPI *gin.RouterGroup) {
	db := config.DB

	// ✅ group สำหรับ Review โดยเฉพาะ
	reviewGroup := memberAPI.Group("")
	reviewGroup.Use(middlewares.RequireMemberReviewMiddleware())

	reviewRepo := repository.NewReviewRepository(db)
	reviewService := services.NewReviewService(reviewRepo)
	reviewController := member_controller.NewReviewController(reviewService)

	// ✅ Routes จะเป็น /api/member/reviews...
	reviewGroup.POST("/reviews", reviewController.CreateReview)
	reviewGroup.GET("/reviews", reviewController.ListReviews)

	// ✅ รีวิวของฉัน
	reviewGroup.GET("/reviews/my", reviewController.ListMyReviews)

	reviewGroup.DELETE("/reviews/:id", reviewController.DeleteReview)
	reviewGroup.POST("/reviews/:id/images", reviewController.UploadReviewImages)
	reviewGroup.POST("/reviews/:id/vote", reviewController.VoteReview)
}
