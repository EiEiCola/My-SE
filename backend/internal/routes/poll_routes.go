package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/config"

	admin_controller "github.com/sut68/team12/backend/internal/app/controller/admin"
	member_controller "github.com/sut68/team12/backend/internal/app/controller/member"
	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/app/services"
)

func SetupPollRoutes(api *gin.RouterGroup) {
	db := config.DB

	pollRepo := repository.NewPollRepository(db)
	pollService := services.NewPollService(pollRepo)

	adminPollController := admin_controller.NewAdminPollController(pollService)
	memberPollController := member_controller.NewPollController(pollService)

	// Mock Admin Auth
	mockAdminAuth := func(c *gin.Context) {
		c.Set("admin_id", 1) // int
		c.Next()
	}

	adminGroup := api.Group("/admin", mockAdminAuth)
	{
		adminGroup.GET("/polls", adminPollController.List)
		adminGroup.POST("/polls/:id/approve", adminPollController.Approve)
		adminGroup.POST("/polls/:id/reject", adminPollController.Reject)
		adminGroup.POST("/polls/:id/close", adminPollController.Close)
	}

	// Mock Member Auth
	mockMemberAuth := func(c *gin.Context) {
		c.Set("member_id", uint(1)) // uint
		c.Next()
	}

	memberGroup := api.Group("/members", mockMemberAuth)
	{

		// Public / Published
		memberGroup.GET("/polls", memberPollController.ListPublished)
		memberGroup.POST("/polls/:id/vote", memberPollController.Vote)
		memberGroup.GET("/polls/:id/results", memberPollController.Results)

		// Draft & Management
		memberGroup.POST("/polls/draft", memberPollController.SaveDraft)            // Save Draft
		memberGroup.PUT("/polls/:id", memberPollController.UpdateDraft)             // Update Draft
		memberGroup.DELETE("/polls/:id", memberPollController.DeletePoll)           // Delete Poll
		memberGroup.POST("/polls/:id/submit", memberPollController.SubmitForReview) // Submit
		memberGroup.POST("/polls/:id/cancel", memberPollController.CancelRequest)   // Cancel

		// My Polls
		memberGroup.GET("/polls/my", memberPollController.GetMyPolls)        // My Polls List
		memberGroup.GET("/polls/my/:id", memberPollController.GetMyPollByID) // My Poll Detail

		// Deprecated (Keep for backward compatibility if needed, or remove)
		memberGroup.POST("/polls", memberPollController.CreateRequest)
	}
}
