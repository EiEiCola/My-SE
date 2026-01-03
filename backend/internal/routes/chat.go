package routes

// import (
// 	"github.com/gin-gonic/gin"
// 	"github.com/sut68/team12/backend/config"
// 	m "github.com/sut68/team12/backend/internal/app/controller/member"
// 	"github.com/sut68/team12/backend/internal/app/repository"
// 	"github.com/sut68/team12/backend/internal/app/services"
// 	"github.com/sut68/team12/backend/internal/app/websocket"
// )

// func SetupChatRoutes(api *gin.RouterGroup) {
// 	db := config.DB
	
// 	// 1. Init WebSocket Hub & Run it
// 	hub := websocket.NewHub(db)
// 	go hub.Run() // ⭐ สำคัญมาก! ต้อง Run Hub ไม่งั้น Socket จะนิ่งสนิท

// 	// 2. Dependency Injection
// 	repo := repository.NewChatRepository(db)
// 	service := services.NewChatService(repo, hub)
// 	chatCtl := m.NewChatController(service, hub)

// 	chat := api.Group("/chat")
// 	{
// 		// HTTP API
// 		chat.GET("/rooms", chatCtl.GetMyRooms)  // ดึงห้องทั้งหมดของฉั           
// 		chat.POST("/rooms", chatCtl.CreateRoom) // สร้างห้องใหม่
// 		chat.POST("/rooms/:id/messages", chatCtl.SendMessage) // ส่งข้อความ (Text/Sticker)
// 		chat.GET("/rooms/:id/messages", chatCtl.GetRoomHistory)
		
// 		// WebSocket Endpoint
// 		chat.GET("/ws", chatCtl.ConnectWebSocket) // url: ws://localhost:8080/api/member/chat/ws?token=...
// 	}
// }