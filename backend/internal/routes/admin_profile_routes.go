package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/internal/app/controller/admin"
)

func SetupAdminProfileRoutes(
	api *gin.RouterGroup,
	adminProfileController *controller.AdminProfileController,
) {
	admin := api.Group("/admin")
	{
		admin.GET("/profile", adminProfileController.GetMe)
		admin.PUT("/profile", adminProfileController.UpdateMe)
		admin.PUT("/profile/national-id", adminProfileController.SetNationalID)
	}
}
