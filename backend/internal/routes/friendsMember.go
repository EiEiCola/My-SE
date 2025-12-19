package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/config"
	"github.com/sut68/team12/backend/internal/app/controller/member"
	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/app/services"
)

// SetupFriendRoutes จะทำการตั้งค่า routes สำหรับระบบจัดการเพื่อนทั้งหมด
func SetupFriendRoutes(api *gin.RouterGroup) {
	db := config.DB
	repo := repository.NewFriendRepository(db)
	friendService := services.NewFriendService(repo)

	friendReqCtl := controller.NewFriendRequestController(friendService)
	friendshipCtl := controller.NewFriendshipController(friendService)
	blockCtl := controller.NewBlockController(friendService)
	followCtl := controller.NewFollowController(friendService)
	// 3. จัดกลุ่มเส้นทางภายใต้ /api

	// api.Use(middlewares.Authorizes()) // เปิดใช้งานหากมี middleware ตรวจสอบ token
	// ------------------ Friend Requests (คำขอเป็นเพื่อน) ------------------
	// ส่งคำขอ บันทึกเป็น Pending (status 1)
	api.POST("/friend-requests", friendReqCtl.Send)

	// ตอบรับ (Accepted: 2) หรือ ปฏิเสธ (Rejected: 3)
	api.POST("/friend-requests/respond", friendReqCtl.Respond)

	// ยกเลิกคำขอ (Hard Delete เฉพาะกรณีที่ส่งผิดและยังไม่ได้รับการตอบรับ)
	api.DELETE("/friend-requests/cancel", friendReqCtl.Cancel)

	// ------------------ Relations (ความสัมพันธ์/เพื่อน) ------------------
	// เลิกเป็นเพื่อน (Update Active เป็น 0 เพื่อเก็บประวัติให้ Admin ดู)
	api.DELETE("/friendships/unfriend", friendshipCtl.Unfriend)

	// ------------------ Follow (ติดตาม/เลิกติดตาม) ------------------
	api.POST("/follows", followCtl.Follow)
	api.DELETE("/follows", followCtl.Unfollow)
	api.POST("/follows/mute", followCtl.Mute)
	api.DELETE("/follows/unmute", followCtl.Unmute)

	// ------------------ Block (บล็อก/เลิกบล็อก) ------------------
	// บล็อก (สร้างบันทึกใหม่ Active: 1 และตัดความสัมพันธ์เพื่อน)
	api.POST("/blocks", blockCtl.Block)

	// เลิกบล็อก (Update Active เป็น 0)
	api.DELETE("/blocks", blockCtl.Unblock)

	// ------------------ ค้นหา/เรียกดูข้อมูล (GET) ------------------
	// มุมมอง User: เห็นเฉพาะข้อมูลที่ Active หรือ Pending
	api.GET("/members", friendshipCtl.GetAllMembers)                          // ทั้งหมดในระบบ
	api.GET("/my/friends", friendshipCtl.GetMyFriends)                        // เพื่อนปัจจุบัน (Active: 1)
	api.GET("/my/followers", friendshipCtl.GetMyFollowers)                    // คนที่ติดตามเรา
	api.GET("/my/following", friendshipCtl.GetMyFollowing)                    // คนที่เราติดตาม
	api.GET("/my/blocks", blockCtl.GetMyBlockedList)                          // รายการที่เราบล็อก (Active: 1)
	api.GET("/my/friend-requests/sent", friendReqCtl.GetSentRequests)         // คำขอที่เราส่ง
	api.GET("/my/friend-requests/received", friendReqCtl.GetReceivedRequests) // คำขอที่มีคนส่งมา
}
