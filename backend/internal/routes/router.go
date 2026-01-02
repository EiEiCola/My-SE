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

	// =========================
	// API ROOT
	// =========================
	api := r.Group("/api")

	// =========================
	// AUTH (public)
	// =========================
	auth := api.Group("/auth")
	SetupAuthRoutes(auth)

	// =========================
	// MEMBER (login required)
	// =========================
	memberAPI := api.Group("/member")
	memberAPI.Use(middlewares.JWTAuthMiddleware())

	// =========================
	// ADMIN (login + admin only)
	// =========================
	adminAPI := api.Group("/admin")
	adminAPI.Use(middlewares.JWTAuthMiddleware())
	adminAPI.Use(middlewares.RequireAdminMiddleware())

	// =========================
	// PUBLIC ROUTES (/api/*)
	// =========================
	{
		SetupPRRoutes(api)
		SetupPollRoutes(api)
		SetupPointRuleRoutes(api)
		SetupFriendRoutes(api)

		// ✅ public reward list
		SetupRewardRoutes(api)
		//revirew
		SetupReviewRoutes(api)
	}

	// =========================
	// ADMIN ROUTES (/api/admin/*)
	// =========================
	{
		// ✅ admin reward (สำคัญ)
		SetupAdminRewardRoutes(adminAPI)

		SetupAdminProfileRoutes(adminAPI, adminProfileController)
		SetupAdminCategoryRoutes(adminAPI, adminCategoryController)
		SetupAdminUserManageRoutes(adminAPI, adminUserController)

		
	}

	// =========================
	// MEMBER ROUTES (/api/member/*)
	// =========================
	{
		SetupMemberProfileRoutes(memberAPI)
		SetupMemberRewardRoutes(memberAPI)
		SetupMemberPostRoutes(memberAPI)
		
	}

	// =========================
	// NON-API ROUTES (เดิม)
	// =========================
	SetupMemberRoutes(r)
	SetupPublicCategoryRoutes(r, config.DB)
}
