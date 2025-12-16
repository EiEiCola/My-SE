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

	// ✅ เพิ่มบรรทัดนี้
  r.Static("/uploads", "./uploads")
  
	api := r.Group("/api")
	// api.Use(middlewares.Authorizes())
	{
		SetupPRRoutes(api)
		SetupPollRoutes(api)
		SetupAdminRewardRoutes(api)
		SetupPointRuleRoutes(api)

		// เพิ่ม route แก้ไขโปรไฟล์แอดมิน
		SetupAdminProfileRoutes(api, adminProfileController)
		// เพิ่ม route จัดการบัญชีผู้ใช้ (Search + Lock/Unlock)
		SetupAdminUserManageRoutes(api, adminUserController)
		// เพิ่ม route จัดการหมวดหมู่ (Admin)
		SetupAdminCategoryRoutes(api, adminCategoryController)
	}

		// route จัดการบัญชีผู้ใช้ (Search + Lock/Unlock)
		SetupAdminUserManageRoutes(api, adminUserController)

		SetupRewardRoutes(api)
		SetupMemberRewardRoutes(api)
		SetupMemberRoutes(r)
		SetupPublicCategoryRoutes(r, config.DB)
	}
	
	
	
	

