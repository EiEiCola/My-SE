package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/config"

	admin_controller "github.com/sut68/team12/backend/internal/app/controller/admin"
	member_controller "github.com/sut68/team12/backend/internal/app/controller/member"
	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/app/services"
	"github.com/sut68/team12/backend/internal/middlewares"
)

// ✅ Call this ONLY ONCE: SetupPollRoutes(api)
func SetupPollRoutes(api *gin.RouterGroup) {
	db := config.DB

	pollRepo := repository.NewPollRepository(db)

	// ⭐ POINT SYSTEM: สร้าง point service แล้ว inject เข้า poll service
	pointService := services.NewPointService(db)

	reportRepo := repository.NewReportRepository(db) // ✅ NEW
	pollService := services.NewPollService(pollRepo, pointService, reportRepo)

	// ✅ Needed for resolving Profile ID from Account ID
	memberRepo := repository.NewMemberRepository(db)
	memberSvc := services.NewMemberService(memberRepo)

	adminPollController := admin_controller.NewAdminPollController(pollService)
	memberPollController := member_controller.NewPollController(pollService, memberSvc)

	// =========================
	// MEMBER: /api/member/*
	// =========================
	member := api.Group("/member")
	member.Use(middlewares.JWTAuthMiddleware())
	{
		// Published/feed
		member.GET("/polls", memberPollController.ListPublished)

		// ✅ NEW: poll detail + my vote
		member.GET("/polls/:id", memberPollController.GetPublishedByID)
		member.GET("/polls/:id/my-vote", memberPollController.GetMyVote)

		// vote + results
		member.POST("/polls/:id/vote", memberPollController.Vote)
		member.GET("/polls/:id/results", memberPollController.Results)

		// draft & manage
		member.POST("/polls/draft", memberPollController.SaveDraft)
		member.PUT("/polls/:id", memberPollController.UpdateDraft)
		member.DELETE("/polls/:id", memberPollController.DeletePoll)

		//submit/cancel
		member.POST("/polls/:id/submit", memberPollController.SubmitForReview)
		member.POST("/polls/:id/cancel", memberPollController.CancelRequest)
		member.POST("/polls/:id/close", memberPollController.ClosePoll) // ✅ NEW: close poll (owner)

		// my polls
		member.GET("/polls/my", memberPollController.GetMyPolls)
		member.GET("/polls/my/:id", memberPollController.GetMyPollByID)

		member.POST("/polls/options/upload", memberPollController.UploadOptionImage)

	}

	// =========================
	// ADMIN: /api/admin/*
	// =========================
	admin := api.Group("/admin")
	admin.Use(
		middlewares.JWTAuthMiddleware(),
		middlewares.RequireAdminPollMiddleware(), // ✅ ใช้ตัวใหม่
	)

	{

		admin.GET("/polls", adminPollController.List)
		admin.GET("/polls/:id", adminPollController.GetByID)
		admin.POST("/polls/:id/approve", adminPollController.Approve)
		admin.POST("/polls/:id/reject", adminPollController.Reject)
		admin.POST("/polls/:id/close", adminPollController.Close)
		admin.DELETE("/polls/:id", adminPollController.Delete)
	}
}
