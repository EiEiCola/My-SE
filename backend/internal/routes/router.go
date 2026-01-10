package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/config"

	adminCtl "github.com/sut68/team12/backend/internal/app/controller/admin"
	memberCtl "github.com/sut68/team12/backend/internal/app/controller/member" // เพิ่ม
	"github.com/sut68/team12/backend/internal/middlewares"
)

// SetupRoutes initializes all routes
func SetupRoutes(
	r *gin.Engine,
	adminProfileController *adminCtl.AdminProfileController,
	adminUserController *adminCtl.AdminUserController,
	adminCategoryController *adminCtl.AdminCategoryController,
	chatController *memberCtl.ChatController, // ✅ เพิ่ม ChatController ตรงนี้
	adminReviewController *adminCtl.AdminReviewController,
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
		SetupChatWSRoutes(api, chatController)
		SetupPRRoutes(api)
		SetupPollRoutes(api)
		SetupAdminRewardRoutes(api)
		SetupPointRuleRoutes(api)

		// ✅ public reward list
		SetupRewardRoutes(api)
		//revirew
		SetupReviewRoutes(api)
		// Report System
		SetupReportRoutes(api)

	}

	// =========================
	// ADMIN ROUTES (/api/admin/*)
	// =========================
	{
		// ✅ admin reward (สำคัญ)
		SetupAdminRewardRoutes(adminAPI)

		// ✅ admin routes (ย้ายมาอยู่ใต้ adminAPI)
		SetupAdminProfileRoutes(adminAPI, adminProfileController)
		SetupAdminCategoryRoutes(adminAPI, adminCategoryController)
		SetupAdminUserManageRoutes(adminAPI, adminUserController)
		SetupAdminReviewRoutes(adminAPI, adminReviewController)

		// ✅ public: list rewards (/api/rewards) ไม่ต้องล็อกอิน

	}

	// =========================
	// MEMBER ROUTES (/api/member/*)
	// =========================

	{
		SetupFriendRoutes(memberAPI, adminAPI) // ส่ง api group เข้าไปเพื่อให้ URL เป็น /api/friend-requests
		SetupMemberProfileRoutes(memberAPI)
		SetupMemberRewardRoutes(memberAPI)
		SetupChatHTTPRoutes(memberAPI, chatController)
		SetupMemberPostRoutes(memberAPI)
		SetupMemberCategoryRoutes(memberAPI, adminCategoryController)
		SetupReviewRoutes(memberAPI)
		// SetupChatRoutes(memberAPI)

	}

	// routes ที่ไม่ได้อยู่ใต้ /api (คงเดิม)
	SetupMemberRoutes(r)
	SetupPublicCategoryRoutes(r, config.DB)
}
