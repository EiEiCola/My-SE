package routes

import (
	"github.com/gin-gonic/gin"
	m "github.com/sut68/team12/backend/internal/app/controller/member"
)

// 1. HTTP Routes (ต้องมี Middleware เช็ค Header)
func SetupChatHTTPRoutes(api *gin.RouterGroup, chatCtl *m.ChatController) {
	chat := api.Group("/chat")
	{
		// Room Management
		chat.GET("/stickers", chatCtl.GetMyStickers) // ✅ Added
		chat.GET("/rooms", chatCtl.GetMyRooms)

		chat.GET("/rooms/:id", chatCtl.GetRoomDetails)
		chat.POST("/rooms", chatCtl.CreateRoom)

		chat.GET("/rooms/:id/members", chatCtl.GetRoomMembers)
		chat.DELETE("/rooms/:id/leave", chatCtl.LeaveRoom)

		// ใน routes.go
		chat.PUT("/rooms/:id", chatCtl.UpdateGroup)
		chat.POST("/rooms/:id/members", chatCtl.InviteMembers)

		chat.PUT("/rooms/:id/members/:member_id/role", chatCtl.UpdateMemberRole)
		chat.DELETE("/rooms/:id/members/:member_id", chatCtl.KickMember) // ✅ Kick Member Route

		// Messaging
		chat.GET("/rooms/:id/messages", chatCtl.GetRoomHistory)
		chat.POST("/rooms/:id/messages", chatCtl.SendMessage)

		// Actions
		chat.DELETE("/rooms/:id/history", chatCtl.ClearChatHistory)
		chat.DELETE("/messages/:message_id", chatCtl.UnsendMessage)
		chat.PUT("/rooms/:id/read", chatCtl.MarkRead) // ✅ Mark Read Endpoint
	}
}

// 2. WebSocket Route (แยกออกมา เพื่อไม่ต้องผ่าน Middleware Header)
// รับ rootAPI เข้ามา (ซึ่งคือ /api) แล้วเราจะต่อ path เอง
func SetupChatWSRoutes(rootAPI *gin.RouterGroup, chatCtl *m.ChatController) {
	// URL ผลลัพธ์: /api/member/chat/ws
	// สาเหตุที่ต้อง manual path เพราะเราไม่อยากใช้ memberAPI group ที่ติด middleware
	rootAPI.GET("/member/chat/ws", chatCtl.ConnectWebSocket)
}
