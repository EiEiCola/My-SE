package controller

// import (
// 	"net/http"
// 	"strconv"

// 	"github.com/gin-gonic/gin"
// 	"github.com/gorilla/websocket"
// 	"github.com/sut68/team12/backend/internal/app/services"
// 	ws "github.com/sut68/team12/backend/internal/app/websocket"
// 	"github.com/sut68/team12/backend/internal/dto"
// 	"github.com/sut68/team12/backend/internal/utils"
// )

// type ChatController struct {
// 	service *services.ChatService
// 	hub     *ws.Hub
// }

// func NewChatController(service *services.ChatService, hub *ws.Hub) *ChatController {
// 	return &ChatController{service: service, hub: hub}
// }

// // ✅ 1. CreateRoom (ที่หายไป)
// func (c *ChatController) CreateRoom(ctx *gin.Context) {
// 	var req dto.CreateRoomRequest
// 	if err := ctx.ShouldBindJSON(&req); err != nil {
// 		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
// 		return
// 	}

// 	userId := ctx.GetUint("userId") // ตรวจสอบ Key Middleware ให้ตรงกับของคุณ

// 	room, err := c.service.CreateRoom(req, userId)
// 	if err != nil {
// 		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
// 		return
// 	}

// 	ctx.JSON(http.StatusOK, gin.H{"data": room})
// }

// // ✅ 2. GetMyRooms (ที่ routes แดงเพราะหาอันนี้ไม่เจอ)
// func (c *ChatController) GetMyRooms(ctx *gin.Context) {
// 	userId := ctx.GetUint("userId")

// 	rooms, err := c.service.GetMyRooms(userId)
// 	if err != nil {
// 		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
// 		return
// 	}

// 	ctx.JSON(http.StatusOK, gin.H{"data": rooms})
// }

// // ✅ 3. SendMessage
// func (c *ChatController) SendMessage(ctx *gin.Context) {
//     // 1. รับค่า id ให้ตรงกับ router (เช่น :roomId)
//     roomIdStr := ctx.Param("roomId") 
//     roomId, err := strconv.ParseUint(roomIdStr, 10, 32)
//     if err != nil {
//         ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Room ID"})
//         return
//     }

//     userId := ctx.GetUint("userId")

//     var req dto.SendMessageRequest
//     if err := ctx.ShouldBindJSON(&req); err != nil {
//         ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
//         return
//     }

//     // 2. บันทึกลง DB ผ่าน Service
//     msg, err := c.service.SendMessage(userId, uint(roomId), req)
//     if err != nil {
//         ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
//         return
//     }

//     // --- ส่วนที่ต้องเพิ่ม: Real-time Broadcast ---
//     // สร้าง Struct ข้อความที่จะส่งผ่าน WebSocket
//     broadcastMsg := ws.WSMessage{
//         Type:    "new_message", // บอก Frontend ว่านี่คือข้อความใหม่
//         Payload: msg,           // ข้อมูลข้อความที่เพิ่งบันทึก (หรือจะแปลงเป็น Response DTO ก่อนก็ได้)
//         RoomID:  uint(roomId),  // ระบุห้อง เพื่อให้ Hub กรองส่งเฉพาะคนในห้องนี้
//     }

//     // ส่งเข้า Hub Channel
//     c.hub.Broadcast <- broadcastMsg
//     // ---------------------------------------

//     ctx.JSON(http.StatusCreated, gin.H{"data": msg})
// }

// // ✅ 4. GetRoomHistory
// func (c *ChatController) GetRoomHistory(ctx *gin.Context) {
// 	roomIdStr := ctx.Param("id")
// 	roomId, _ := strconv.ParseUint(roomIdStr, 10, 32)
// 	userId := ctx.GetUint("userId")

// 	msgs, err := c.service.GetRoomHistory(userId, uint(roomId))
// 	if err != nil {
// 		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
// 		return
// 	}
// 	ctx.JSON(http.StatusOK, gin.H{"data": msgs})
// }

// // ✅ 5. WebSocket Connection
// var upgrader = websocket.Upgrader{
// 	CheckOrigin: func(r *http.Request) bool { return true },
// }

// func (c *ChatController) ConnectWebSocket(ctx *gin.Context) {
// 	token := ctx.Query("token")
// 	claims, err := utils.ParseToken(token)
// 	if err != nil {
// 		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
// 		return
// 	}
// 	userID := claims.UserID

// 	conn, err := upgrader.Upgrade(ctx.Writer, ctx.Request, nil)
// 	if err != nil { return }

// 	// Register Client to Hub
// 	client := &ws.Client{UserID: userID, Conn: conn}
// 	c.hub.Register <- client

// 	defer func() {
// 		c.hub.Unregister <- client
// 		conn.Close()
// 	}()

// 	for {
// 		var msg ws.WSMessage
// 		err := conn.ReadJSON(&msg)
// 		if err != nil { break }
// 		// ปกติเราจะรับ Message ผ่าน API SendMessage แล้วใช้ WS เพื่อ Push Noti
// 		// แต่ถ้าจะรับผ่าน WS โดยตรง ก็เขียน Logic เรียก Service ตรงนี้ได้
// 	}
// }