package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/config"
	"github.com/sut68/team12/backend/internal/app/controller/member"
	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/app/services"
)

// SetupFriendRoutes จะทำการตั้งค่า routes สำหรับระบบจัดการเพื่อนทั้งหมด
func SetupFriendRoutes(r *gin.Engine) {
	db := config.DB 

	repo := repository.NewFriendRepository(db)
	friendService := services.NewFriendService(repo)

	// Controllers ที่เกี่ยวข้อง
	friendReqCtl := controller.NewFriendRequestController(friendService)
	friendshipCtl := controller.NewFriendshipController(friendService)
	blockCtl := controller.NewBlockController(friendService)
	
	// ** เพิ่ม Follow Controller **
	followCtl := controller.NewFollowController(friendService) 

	api := r.Group("/api")
	// api.Use(middlewares.Authorizes()) // ใส่ Authentication middleware ที่นี่
	{
		// ------------------ Friend Requests (คำขอเป็นเพื่อน) ------------------
		api.POST("/friend-requests", friendReqCtl.Send)
		api.POST("/friend-requests/respond", friendReqCtl.Respond)
		// ใช้ DELETE เพื่อยกเลิก (เป็นการลบทิ้ง)
		api.DELETE("/friend-requests/cancel", friendReqCtl.Cancel) 
		
		// ------------------ Relations (ความสัมพันธ์/เพื่อน) ------------------
		// ใช้ DELETE เพื่อลบความสัมพันธ์ (Unfriend)
		api.DELETE("/friendships/unfriend", friendshipCtl.Unfriend)
		
		// ------------------ Follow (ติดตาม/เลิกติดตาม) ------------------
		// POST /api/follows 		-> ติดตาม
		api.POST("/follows", followCtl.Follow)
		// DELETE /api/follows 	-> เลิกติดตาม (Unfollow/Mute)
		api.DELETE("/follows", followCtl.Unfollow)

		// POST /api/follows/mute 	-> ซ่อนโพสต์
		api.POST("/follows/mute", followCtl.Mute)
		// DELETE /api/follows/mute -> ยกเลิกการซ่อนโพสต์ (Unmute)
		api.DELETE("/follows/mute", followCtl.Unmute)

		// ------------------ Block (บล็อก/เลิกบล็อก) ------------------
		// POST /api/blocks 		-> บล็อก
		api.POST("/blocks", blockCtl.Block)
		// DELETE /api/blocks 	-> เลิกบล็อก
		api.DELETE("/blocks", blockCtl.Unblock) 
	}
}