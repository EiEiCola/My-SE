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

// GetMyRooms: ดึงรายการห้องของฉัน
func (c *ChatController) GetMyRooms(ctx *gin.Context) {
	userId, err := c.getMemberID(ctx)
	if err != nil {
		return
	}

	rooms, err := c.service.GetMyRooms(userId)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"data": rooms})
}

// GetRoomMembers: ดูสมาชิกในห้อง (สำหรับ Group)
func (c *ChatController) GetRoomMembers(ctx *gin.Context) {
	roomId, err := parseUintParam(ctx, "id") // ✅ เรียกใช้ฟังก์ชันที่มีอยู่แล้วใน member_post_helpers.go
	if err != nil {
		return
	}

	members, err := c.service.GetRoomMembers(roomId)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"data": members})
}

// GetRoomDetails: ดึงข้อมูลห้องแบบเจาะจง
func (c *ChatController) GetRoomDetails(ctx *gin.Context) {
	roomId, err := parseUintParam(ctx, "id")
	if err != nil {
		return
	}

	room, err := c.service.GetRoomByID(roomId)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Room not found"})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"data": room})
}

// LeaveRoom: ออกจากห้อง
func (c *ChatController) LeaveRoom(ctx *gin.Context) {
	userId, err := c.getMemberID(ctx)
	if err != nil {
		return
	}
	roomId, err := parseUintParam(ctx, "id")
	if err != nil {
		return
	}

	if err := c.service.LeaveRoom(userId, roomId); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "Left room successfully"})
}

// ----------------------------------------------------------------
// 2. Messaging
// ----------------------------------------------------------------

// SendMessage: ส่งข้อความ
func (c *ChatController) SendMessage(ctx *gin.Context) {
	userId, err := c.getMemberID(ctx)
	if err != nil {
		return
	}
	roomId, err := parseUintParam(ctx, "id")
	if err != nil {
		return
	}

	var req dto.SendMessageRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	msg, err := c.service.SendMessage(userId, roomId, req)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusCreated, gin.H{"data": msg})
}

// GetRoomHistory: ดึงประวัติแชท
func (c *ChatController) GetRoomHistory(ctx *gin.Context) {
	userId, err := c.getMemberID(ctx)
	if err != nil {
		return
	}
	roomId, err := parseUintParam(ctx, "id")
	if err != nil {
		return
	}

	msgs, err := c.service.GetRoomHistory(userId, roomId)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"data": msgs})
}

// ----------------------------------------------------------------
// 3. Actions (Unsend & Clear)
// ----------------------------------------------------------------

// ClearChatHistory: ล้างแชท (ฝั่งตัวเอง)
func (c *ChatController) ClearChatHistory(ctx *gin.Context) {
	userId, err := c.getMemberID(ctx)
	if err != nil {
		return
	}
	roomId, err := parseUintParam(ctx, "id")
	if err != nil {
		return
	}

	if err := c.service.ClearChatHistory(userId, roomId); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "Chat history cleared"})
}

// UnsendMessage: ยกเลิกข้อความ (ลบข้อความเฉพาะอันที่ตัวเองส่ง)
func (c *ChatController) UnsendMessage(ctx *gin.Context) {
	userId, err := c.getMemberID(ctx)
	if err != nil {
		return
	}

	// Parse message_id from path parameter
	msgIdStr := ctx.Param("message_id")
	msgIdUint64, err := strconv.ParseUint(msgIdStr, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid message ID format"})
		return
	}
	msgId := uint(msgIdUint64)

	err = c.service.UnsendMessage(userId, msgId)
	if err != nil {
		// Log the actual error for debugging
		println("❌ UnsendMessage Error:", err.Error())
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "Message unsent"})
}

// GetMyStickers: ดึงสติ๊กเกอร์ที่ฉันมี
func (c *ChatController) GetMyStickers(ctx *gin.Context) {
	userId, err := c.getMemberID(ctx)
	if err != nil {
		return
	}

	stickers, err := c.service.GetMyStickers(userId)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"data": stickers})
}

// ----------------------------------------------------------------
// 4. WebSocket
// ----------------------------------------------------------------

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

func (c *ChatController) ConnectWebSocket(ctx *gin.Context) {
	token := ctx.Query("token")
	if token == "" {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Token is required"})
		return
	}

	claims, err := utils.ParseToken(token)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
		return
	}

	// Resolve Member ID from Account ID
	memberID, err := c.service.GetMemberIDByAccountID(claims.UserID)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Member profile not found"})
		return
	}

	conn, err := upgrader.Upgrade(ctx.Writer, ctx.Request, nil)
	if err != nil {
		return
	}

	// ⭐ FIX: Check buffer size! Unbuffered channel + select default = Instant Disconnect on heavy load
	// ✅ Logic Update: Use memberID instead of claims.UserID (AccountID)
	client := &ws.Client{UserID: memberID, Conn: conn, Send: make(chan ws.WSMessage, 256)}
	c.hub.Register <- client

	// Start goroutines for read/write
	go client.WritePump()
	go client.ReadPump(c.hub)
}

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

// Helper: Resolve Member ID from Account ID
func (c *ChatController) getMemberID(ctx *gin.Context) (uint, error) {
	accountID, exists := ctx.Get("user_id")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in context"})
		return 0, http.ErrNoCookie
	}

	// Convert accountID to uint
	accIDUint := convertToUint(accountID)

	// Call Repository to get real MemberID
	memberID, err := c.service.GetMemberIDByAccountID(accIDUint)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Member profile not found"})
		return 0, err
	}
	return memberID, nil
}

func (c *ChatController) CreateRoom(ctx *gin.Context) {
	userId, err := c.getMemberID(ctx)
	if err != nil {
		return
	}

	var req dto.CreateRoomRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// เรียก Service (Service จะแยก Logic Private/Group เอง)
	room, err := c.service.CreateRoom(req, userId) // หรือ CreateGroupRoom ถ้าแยก
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": room})
}

// UpdateGroupInfo
func (c *ChatController) UpdateGroup(ctx *gin.Context) {
	userID, _ := c.getMemberID(ctx)
	roomID, _ := parseUintParam(ctx, "id")

	var req struct {
		Name      string `json:"name"`
		AvatarURL string `json:"avatar_url"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		return
	}

	room, err := c.service.UpdateGroupInfo(userID, roomID, req.Name, req.AvatarURL)
	if err != nil {
		ctx.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"data": room})
}

// Invite Members
func (c *ChatController) InviteMembers(ctx *gin.Context) {
	userID, _ := c.getMemberID(ctx)
	roomID, _ := parseUintParam(ctx, "id")

	var req struct {
		MemberIDs []uint `json:"member_ids"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		return
	}

	if err := c.service.AddMembersToGroup(userID, roomID, req.MemberIDs); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "Members added"})
}

// Update Role
func (c *ChatController) UpdateMemberRole(ctx *gin.Context) {
	userID, _ := c.getMemberID(ctx)
	roomID, _ := parseUintParam(ctx, "id")
	targetID, _ := parseUintParam(ctx, "member_id")

	var req struct {
		Role string `json:"role"`
	} // "admin" or "member"
	if err := ctx.ShouldBindJSON(&req); err != nil {
		return
	}

	if err := c.service.UpdateMemberRole(userID, roomID, targetID, req.Role); err != nil {
		ctx.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "Role updated"})
}

// Kick Member
func (c *ChatController) KickMember(ctx *gin.Context) {
	adminID, _ := c.getMemberID(ctx)
	roomID, _ := parseUintParam(ctx, "id")
	targetID, _ := parseUintParam(ctx, "member_id")

	if err := c.service.KickMember(adminID, roomID, targetID); err != nil {
		ctx.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "Member kicked"})
}

// Mark Read
func (c *ChatController) MarkRead(ctx *gin.Context) {
	userId, err := c.getMemberID(ctx)
	if err != nil {
		return
	}
	roomId, err := parseUintParam(ctx, "id")
	if err != nil {
		return
	}

	if err := c.service.MarkMessagesAsRead(userId, roomId); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "Messages marked as read"})
}
