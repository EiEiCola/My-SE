package routes

import (
	"github.com/gin-gonic/gin"
	controller "github.com/sut68/team12/backend/internal/app/controller/admin"
)

func SetupAdminReviewRoutes(router *gin.RouterGroup, c *controller.AdminReviewController) {
	adminGroup := router.Group("/reviews")
	{
		adminGroup.GET("", c.ListReviews)
		adminGroup.DELETE("/:id", c.DeleteReview)
	}
}
