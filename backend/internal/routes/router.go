package routes

import (
	"github.com/gin-gonic/gin"
	controller "github.com/sut68/team12/backend/internal/app/controller/admin"
)

// SetupRoutes initializes all routes
func SetupRoutes(
	r *gin.Engine,
	adminProfileController *controller.AdminProfileController,
	adminUserController *controller.AdminUserController,
) {

	// ✅ เพิ่มบรรทัดนี้
  r.Static("/uploads", "./uploads")
  
	api := r.Group("/api")
	// api.Use(middlewares.Authorizes())
	{
		SetupPRRoutes(api)
		SetupPollRoutes(api)

		SetupAdminRewardRoutes(api)
		SetupPointRuleRoutes(api)

		// route แก้ไขโปรไฟล์แอดมิน
		SetupAdminProfileRoutes(api, adminProfileController)

		// route จัดการบัญชีผู้ใช้ (Search + Lock/Unlock)
		SetupAdminUserManageRoutes(api, adminUserController)

		SetupRewardRoutes(api)
		SetupMemberRewardRoutes(api)
	}
	// ของเดิม
	SetupMemberRoutes(r)
}
