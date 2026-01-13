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

	// ⭐ POINT SYSTEM: สร้าง PointService สำหรับคำนวณ/ให้แต้มจากกิจกรรม
	pointSvc := services.NewPointService(db)

	// ⭐ POINT SYSTEM: ส่ง pointSvc เข้า ReviewService (เพื่อให้แต้มตอน CreateReview)
	reviewService := services.NewReviewService(reviewRepo, pointSvc)

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
