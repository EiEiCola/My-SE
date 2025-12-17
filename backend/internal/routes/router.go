package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/config"
	controller "github.com/sut68/team12/backend/internal/app/controller/admin"
)

// SetupRoutes initializes all routes
func SetupRoutes(
	r *gin.Engine,
	adminProfileController *controller.AdminProfileController,
	adminUserController *controller.AdminUserController,
	adminCategoryController *controller.AdminCategoryController,
) {
	api := r.Group("/api")
	// api.Use(middlewares.Authorizes())
	{
		SetupPRRoutes(api)
		SetupPollRoutes(api)
		SetupAdminRewardRoutes(api)
		SetupPointRuleRoutes(api)
<<<<<<< HEAD
		// ✅ เพิ่ม route แก้ไขโปรไฟล์แอดมิน
=======

		// เพิ่ม route แก้ไขโปรไฟล์แอดมิน
>>>>>>> main
		SetupAdminProfileRoutes(api, adminProfileController)
		// เพิ่ม route จัดการบัญชีผู้ใช้ (Search + Lock/Unlock)
		SetupAdminUserManageRoutes(api, adminUserController)
<<<<<<< HEAD
		SetupReviewRoutes(api)
=======
		// เพิ่ม route จัดการหมวดหมู่ (Admin)
		SetupAdminCategoryRoutes(api, adminCategoryController)
>>>>>>> main
	}

	// ของเดิม
	SetupMemberRoutes(r)
	// Public category routes (ไม่ต้อง auth)
	SetupPublicCategoryRoutes(r, config.DB)
}
