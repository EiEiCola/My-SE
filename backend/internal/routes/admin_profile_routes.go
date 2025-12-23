package routes

import (
	"github.com/gin-gonic/gin"
	adminctl "github.com/sut68/team12/backend/internal/app/controller/admin"
)

func SetupAdminProfileRoutes(
	admin *gin.RouterGroup, // ✅ รับ /api/admin มาเลย
	adminProfileController *adminctl.AdminProfileController,
) {
	admin.GET("/profile", adminProfileController.GetMe)
	admin.PUT("/profile", adminProfileController.UpdateMe)
	admin.PUT("/profile/national-id", adminProfileController.SetNationalID)
}
