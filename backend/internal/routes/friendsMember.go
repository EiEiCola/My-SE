package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/config"
	a "github.com/sut68/team12/backend/internal/app/controller/admin"
	m "github.com/sut68/team12/backend/internal/app/controller/member"
	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/app/services"
)

// รับแค่ 2 groups พอครับ (เพราะไม่ต้องใช้ public แล้ว)
func SetupFriendRoutes(memberGroup *gin.RouterGroup, adminGroup *gin.RouterGroup) {
	db := config.DB
	repo := repository.NewFriendRepository(db)
	friendService := services.NewFriendService(repo)

	// Init Controllers
	adminFriendCtl := a.NewAdminFriendController(friendService)
	friendReqCtl := m.NewFriendRequestController(friendService)
	friendshipCtl := m.NewFriendshipController(friendService)
	blockCtl := m.NewBlockController(friendService)
	followCtl := m.NewFollowController(friendService)

	// ------------------------------------------------------------
	// 1. Member Routes (ต้อง Login) -> URL: /api/member/...
	// ------------------------------------------------------------
	{
		// ย้ายมาไว้ในนี้ครับ (คนนอกดูไม่ได้แล้ว)
		// ไฟล์ routes.go (ใหม่)
		memberGroup.GET("/members", friendshipCtl.GetAllMembers)             // ✅ ตรงกับ /api/member/members
		memberGroup.GET("/members/popular", friendshipCtl.GetPopularMembers) // ✅ ตรงกับ /api/member/members/popular

		// Public/Member Data (Anyone can view)
		memberGroup.GET("/members/:target_id/friends", friendshipCtl.GetMemberFriends)
		memberGroup.GET("/members/:target_id/followers", friendshipCtl.GetMemberFollowers)
		memberGroup.GET("/members/:target_id/following", friendshipCtl.GetMemberFollowing)

		// Friend Requests
		memberGroup.POST("/friend-requests", friendReqCtl.Send)
		memberGroup.PUT("/friend-requests/:id/respond", friendReqCtl.Respond)
		memberGroup.PUT("/friend-requests/:id/cancel", friendReqCtl.Cancel)
		memberGroup.GET("/my/friend-requests/sent", friendReqCtl.GetSentRequests)
		memberGroup.GET("/my/friend-requests/received", friendReqCtl.GetReceivedRequests)

		// Friendships
		memberGroup.PUT("/friends/:target_id/unfriend", friendshipCtl.Unfriend)
		memberGroup.GET("/my/friends", friendshipCtl.GetMyFriends)

		// Follows
		memberGroup.POST("/follows", followCtl.Follow)
		memberGroup.PUT("/follows/:target_id/unfollow", followCtl.Unfollow)
		memberGroup.PUT("/followers/:target_id/remove", followCtl.RemoveFollower) // ⭐ NEW
		memberGroup.PUT("/follows/:target_id/mute", followCtl.Mute)
		memberGroup.PUT("/follows/:target_id/unmute", followCtl.Unmute)
		memberGroup.GET("/my/followers", friendshipCtl.GetMyFollowers)
		memberGroup.GET("/my/following", friendshipCtl.GetMyFollowing)

		// Blocks
		memberGroup.POST("/blocks", blockCtl.Block)
		memberGroup.PUT("/blocks/:target_id/unblock", blockCtl.Unblock)
		memberGroup.GET("/my/blocks", blockCtl.GetBlockedList)
	}

	// ------------------------------------------------------------
	// 2. Admin Routes (Admin Only) -> URL: /api/admin/...
	// ------------------------------------------------------------
	{
		// GET Data
		adminGroup.GET("/friend-logs", adminFriendCtl.AdminGetAllLogs)         // ดู Relations
		adminGroup.GET("/friend-requests", adminFriendCtl.AdminGetAllRequests) // ดู Requests
		adminGroup.GET("/blocks", adminFriendCtl.AdminGetAllBlocks)            // ดู Blocks

		// DELETE Actions
		adminGroup.DELETE("/friend-requests/:id", adminFriendCtl.AdminDeleteRequest)
		adminGroup.DELETE("/friendships", adminFriendCtl.AdminDeleteRelation)
		adminGroup.DELETE("/blocks", adminFriendCtl.AdminDeleteBlock)
	}
}
