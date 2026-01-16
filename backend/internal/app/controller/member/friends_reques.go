package controller

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/internal/app/services"
	"github.com/sut68/team12/backend/internal/dto"
	"github.com/sut68/team12/backend/internal/entity" // ⭐ ตรวจสอบ Path นี้ให้ตรงกับโปรเจกต์คุณ
)

type FriendRequestController struct {
	Service *services.FriendService
}

func NewFriendRequestController(s *services.FriendService) *FriendRequestController {
	return &FriendRequestController{Service: s}
}

// ---------------------------------------------------------
// Helper Function: แปลง Account ID (จาก Token) -> Member ID (ตาราง Profile)
// ---------------------------------------------------------
func (c *FriendRequestController) getMemberID(ctx *gin.Context) (int, error) {
	accountID := ctx.MustGet("user_id").(uint)

	// 2. ค้นหาว่า Account ID นี้ ผูกกับ Member ID อะไรในตาราง members
	var member entity.Member
	// Fix: Query by member_account_id, not id
	if err := c.Service.Repo.DB.Where("member_account_id = ?", accountID).First(&member).Error; err != nil {
		return 0, err
	}

	return int(member.ID), nil
}

// Send: ส่งคำขอเป็นเพื่อน
func (c *FriendRequestController) Send(ctx *gin.Context) {
	var body dto.SendRequestDTO
	if err := ctx.ShouldBindJSON(&body); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ⭐ 1. แปลง AccountID -> MemberID
	memberID, err := c.getMemberID(ctx)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Member profile not found"})
		return
	}
	body.SenderID = memberID

	// ⭐ 2. ส่ง Service
	if err := c.Service.SendRequest(body); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusCreated, gin.H{"message": "Friend request sent"})
}

// Respond: ตอบรับ/ปฏิเสธ คำขอ
func (c *FriendRequestController) Respond(ctx *gin.Context) {
	idStr := ctx.Param("id")
	requestID, err := strconv.Atoi(idStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request ID"})
		return
	}

	var body struct {
		Accept bool `json:"accept"`
	}
	if err := ctx.ShouldBindJSON(&body); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ⭐ 1. แปลง AccountID -> MemberID
	memberID, err := c.getMemberID(ctx)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Member profile not found"})
		return
	}

	dto := dto.RespondRequestDTO{
		RequestID: uint(requestID),
		Accept:    body.Accept,
		MemberID:  memberID, // ใช้ ID ที่ถูกต้อง
	}

	if err := c.Service.RespondRequest(dto); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "Responded to friend request"})
}

// Cancel: ยกเลิกคำขอที่ส่งไป
func (c *FriendRequestController) Cancel(ctx *gin.Context) {
	idStr := ctx.Param("id")
	requestID, err := strconv.Atoi(idStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request ID"})
		return
	}

	// ⭐ 1. แปลง AccountID -> MemberID
	memberID, err := c.getMemberID(ctx)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Member profile not found"})
		return
	}

	dto := dto.CancelRequestDTO{
		RequestID: uint(requestID),
		MemberID:  memberID, // ใช้ ID ที่ถูกต้อง
	}

	if err := c.Service.CancelRequest(dto); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "Friend request cancelled"})
}

// GetSentRequests: ดูคำขอที่เราส่งไป
func (c *FriendRequestController) GetSentRequests(ctx *gin.Context) {
	// ⭐ 1. แปลง AccountID -> MemberID
	memberID, err := c.getMemberID(ctx)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Member profile not found"})
		return
	}

	reqs, err := c.Service.Repo.GetFriendRequests(memberID, "sent")
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	// ⭐ 2. ส่ง data ให้ React
	ctx.JSON(http.StatusOK, gin.H{"data": reqs})
}

// GetReceivedRequests: ดูคำขอที่มีคนส่งมาหาเรา
func (c *FriendRequestController) GetReceivedRequests(ctx *gin.Context) {
	// ⭐ 1. แปลง AccountID -> MemberID
	memberID, err := c.getMemberID(ctx)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Member profile not found"})
		return
	}

	reqs, err := c.Service.Repo.GetFriendRequests(memberID, "received")
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	// ⭐ 2. ส่ง data ให้ React
	ctx.JSON(http.StatusOK, gin.H{"data": reqs})
}
