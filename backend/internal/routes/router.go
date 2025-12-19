package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/config"

	adminCtl "github.com/sut68/team12/backend/internal/app/controller/admin"
	"github.com/sut68/team12/backend/internal/middlewares"
)

// SetupRoutes initializes all routes
func SetupRoutes(
	r *gin.Engine,
	adminProfileController *adminCtl.AdminProfileController,
	adminUserController *adminCtl.AdminUserController,
	adminCategoryController *adminCtl.AdminCategoryController,
) {
	// static files
	r.Static("/uploads", "./uploads")

	// ✅ API group
	api := r.Group("/api")

	// ✅ Auth routes under /api/auth (ไม่ protect)
	auth := api.Group("/auth")
	SetupAuthRoutes(auth)

	// ✅ Protected group: /api/member/*
	memberAPI := api.Group("/member")
	memberAPI.Use(middlewares.JWTAuthMiddleware())

	// ✅ Protected group: /api/admin/* (admin only)
	adminAPI := api.Group("/admin")
	adminAPI.Use(middlewares.JWTAuthMiddleware())
	adminAPI.Use(middlewares.RequireAdminMiddleware())

	// routes ที่อยู่ใต้ /api (ของเดิม)
	{
		SetupPRRoutes(api)
		SetupPollRoutes(api)
		SetupAdminRewardRoutes(api)
		SetupPointRuleRoutes(api)

    SetupFriendRoutes(api) // ส่ง api group เข้าไปเพื่อให้ URL เป็น /api/friend-requests
    
		// ✅ admin routes (ย้ายมาอยู่ใต้ adminAPI)
		SetupAdminProfileRoutes(adminAPI, adminProfileController)
		SetupAdminCategoryRoutes(adminAPI, adminCategoryController)
		SetupAdminUserManageRoutes(adminAPI, adminUserController)

		// ✅ public: list rewards (/api/rewards) ไม่ต้องล็อกอิน
		SetupRewardRoutes(api)
	}

	// ✅ member protected routes (อยู่ใต้ memberAPI)
	{
		SetupMemberProfileRoutes(memberAPI)
		SetupMemberRewardRoutes(memberAPI)
	}

	// routes ที่ไม่ได้อยู่ใต้ /api (คงเดิม)
	SetupMemberRoutes(r)
	SetupPublicCategoryRoutes(r, config.DB)
}