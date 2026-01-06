package controller

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/sut68/team12/backend/internal/app/services"
	ws "github.com/sut68/team12/backend/internal/app/websocket"
	"github.com/sut68/team12/backend/internal/dto"
	"github.com/sut68/team12/backend/internal/utils"
)

type ChatController struct {
	service *services.ChatService
	hub     *ws.Hub
}

func NewChatController(service *services.ChatService, hub *ws.Hub) *ChatController {
	return &ChatController{service: service, hub: hub}
}

// ----------------------------------------------------------------
// 1. Room Management
// ----------------------------------------------------------------

// CreateRoom: สร้างห้อง (Private / Group)
func (c *ChatController) CreateRoom(ctx *gin.Context) {
	var req dto.CreateRoomRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	userId, _ := ctx.Get("user_id")
	room, err := c.service.CreateRoom(req, convertToUint(userId))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"data": room})
}

// GetMyRooms: ดึงรายการห้องของฉัน
func (c *ChatController) GetMyRooms(ctx *gin.Context) {
	userId, _ := ctx.Get("user_id")
	rooms, err := c.service.GetMyRooms(convertToUint(userId))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"data": rooms})
}

// ✅ GetRoomMembers: ดูสมาชิกในห้อง (สำหรับ Group)
func (c *ChatController) GetRoomMembers(ctx *gin.Context) {
	roomIdStr := ctx.Param("id")
	roomId, _ := strconv.ParseUint(roomIdStr, 10, 32)

	members, err := c.service.GetRoomMembers(uint(roomId))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"data": members})
}

// ✅ LeaveRoom: ออกจากห้อง
func (c *ChatController) LeaveRoom(ctx *gin.Context) {
	roomIdStr := ctx.Param("id")
	roomId, _ := strconv.ParseUint(roomIdStr, 10, 32)
	userId, _ := ctx.Get("user_id")

	if err := c.service.LeaveRoom(convertToUint(userId), uint(roomId)); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "left room successfully"})
}

// ----------------------------------------------------------------
// 2. Messaging
// ----------------------------------------------------------------

// SendMessage: ส่งข้อความ
func (c *ChatController) SendMessage(ctx *gin.Context) {
	roomIdStr := ctx.Param("id")
	roomId, err := strconv.ParseUint(roomIdStr, 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	userId, _ := ctx.Get("user_id")
	var req dto.SendMessageRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	msg, err := c.service.SendMessage(convertToUint(userId), uint(roomId), req)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusCreated, gin.H{"data": msg})
}

// GetRoomHistory: ดึงประวัติแชท
func (c *ChatController) GetRoomHistory(ctx *gin.Context) {
	roomIdStr := ctx.Param("id")
	roomId, _ := strconv.ParseUint(roomIdStr, 10, 32)
	userId, _ := ctx.Get("user_id")

	msgs, err := c.service.GetRoomHistory(convertToUint(userId), uint(roomId))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"data": msgs})
}

// ReadMessage: อ่านข้อความ (Mock ไว้ก่อนเพื่อให้ Routes ไม่แดง)
func (c *ChatController) ReadMessage(ctx *gin.Context) {
	// TODO: Implement Logic Mark as Read in Service
	ctx.JSON(http.StatusOK, gin.H{"message": "read status updated"})
}

// ----------------------------------------------------------------
// 3. Actions (Unsend & Clear)
// ----------------------------------------------------------------

// ✅ ClearChatHistory: ล้างแชท (ฝั่งตัวเอง)
func (c *ChatController) ClearChatHistory(ctx *gin.Context) {
	roomIdStr := ctx.Param("id")
	roomId, _ := strconv.ParseUint(roomIdStr, 10, 32)
	userId, _ := ctx.Get("user_id")

	if err := c.service.ClearChatHistory(convertToUint(userId), uint(roomId)); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "chat history cleared"})
}

// ✅ UnsendMessage: ยกเลิกข้อความ (ลบข้อความเฉพาะอันที่ตัวเองส่ง)
func (c *ChatController) UnsendMessage(ctx *gin.Context) {
	msgIdStr := ctx.Param("message_id")
	msgId, _ := strconv.ParseUint(msgIdStr, 10, 32)
	userId, _ := ctx.Get("user_id")

	if err := c.service.UnsendMessage(convertToUint(userId), uint(msgId)); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "message unsent"})
}

// ----------------------------------------------------------------
// 4. WebSocket
// ----------------------------------------------------------------

var upgrader = websocket.Upgrader{CheckOrigin: func(r *http.Request) bool { return true }}

func (c *ChatController) ConnectWebSocket(ctx *gin.Context) {
	token := ctx.Query("token")
	claims, err := utils.ParseToken(token)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
		return
	}

	conn, err := upgrader.Upgrade(ctx.Writer, ctx.Request, nil)
	if err != nil {
		return
	}

	client := &ws.Client{UserID: claims.UserID, Conn: conn, Send: make(chan ws.WSMessage)}
	c.hub.Register <- client
	go client.WritePump()
	go client.ReadPump(c.hub)
}

// Helper Convert
func convertToUint(val interface{}) uint {
	switch v := val.(type) {
	case uint:
		return v
	case int:
		return uint(v)
	case float64:
		return uint(v)
	default:
		return 0
	}
}
