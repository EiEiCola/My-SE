package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/config"

	adminCtl "github.com/sut68/team12/backend/internal/app/controller/admin"
	memberCtl "github.com/sut68/team12/backend/internal/app/controller/member"
	"github.com/sut68/team12/backend/internal/app/services"
	"github.com/sut68/team12/backend/internal/app/websocket"
	"github.com/sut68/team12/backend/internal/middlewares"
)

func SetupRoutes(
	r *gin.Engine,
	adminProfileController *adminCtl.AdminProfileController,
	adminUserController *adminCtl.AdminUserController,
	adminCategoryController *adminCtl.AdminCategoryController,
	chatController *memberCtl.ChatController,
	adminReviewController *adminCtl.AdminReviewController,
	uploadController *memberCtl.UploadController,
	memberService services.MemberService,
	wsHub *websocket.Hub, // ✅ เพิ่ม WebSocket Hub
) {
	r.Static("/uploads", "./uploads")

	api := r.Group("/api")

	auth := api.Group("/auth")
	SetupAuthRoutes(auth)

	memberAPI := api.Group("/member")
	memberAPI.Use(middlewares.JWTAuthMiddleware())

	adminAPI := api.Group("/admin")
	adminAPI.Use(middlewares.JWTAuthMiddleware())
	adminAPI.Use(middlewares.RequireAdminMiddleware())

	{
		SetupChatWSRoutes(api, chatController)
		SetupPRRoutes(api, memberService)
		SetupPollRoutes(api)
		SetupAdminRewardRoutes(api)
		SetupPointRuleRoutes(api)

		SetupRewardRoutes(api)

		// ✅ แยก public reviews ออก (ให้ list ได้โดยไม่ต้อง member middleware)
		SetupPublicReviewRoutes(api)

		SetupReportRoutes(api, memberService)

		// ✅ public target types สำหรับ report form
		SetupTargetTypeRoutes(api)
	}

	{
		SetupAdminRewardRoutes(adminAPI)

		SetupAdminProfileRoutes(adminAPI, adminProfileController)
		SetupAdminCategoryRoutes(adminAPI, adminCategoryController)
		SetupAdminUserManageRoutes(adminAPI, adminUserController)
		SetupAdminReviewRoutes(adminAPI, adminReviewController)

		// ✅ admin post management
		SetupAdminPostRoutes(adminAPI, wsHub)

		// ✅ public: list rewards (/api/rewards) ไม่ต้องล็อกอิน

	}

	{
		SetupFriendRoutes(memberAPI, adminAPI)
		SetupMemberProfileRoutes(memberAPI)
		SetupMemberRewardRoutes(memberAPI)
		SetupChatHTTPRoutes(memberAPI, chatController)
		SetupMemberPostRoutes(memberAPI, wsHub)
		SetupMemberCategoryRoutes(memberAPI, adminCategoryController)
		SetupNotificationRoutes(memberAPI)
		SetupUploadRoutes(memberAPI, uploadController) // ✅ เรียกใช้ route upload
		// SetupChatRoutes(memberAPI)

		// ✅ member reviews (create/delete/vote/my/images) อยู่ใต้ /api/member
		SetupMemberReviewRoutes(memberAPI)
	}

	SetupMemberRoutes(r)
	SetupPublicCategoryRoutes(r, config.DB)
}
