package controller

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/app/services"
)

type NotificationController struct {
	Repo          *repository.NotificationRepository
	MemberService services.MemberService
}

func NewNotificationController(repo *repository.NotificationRepository, memberService services.MemberService) *NotificationController {
	return &NotificationController{
		Repo:          repo,
		MemberService: memberService,
	}
}

// GET /api/member/notifications
func (c *NotificationController) GetNotifications(ctx *gin.Context) {
	accountID, exists := ctx.Get("user_id")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	// ✅ แปลง Account ID → Member ID
	member, err := c.MemberService.GetProfileByAccountID(accountID.(uint))
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "member profile not found"})
		return
	}

	notifications, err := c.Repo.GetByUserID(member.ID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": notifications})
}

// PATCH /api/member/notifications/:id/read
func (c *NotificationController) MarkAsRead(ctx *gin.Context) {
	postID := ctx.Param("id")
	id, err := strconv.ParseUint(postID, 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	if err := c.Repo.MarkAsRead(uint(id)); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "marked as read"})
}

// PATCH /api/member/notifications/read-all - อ่านทั้งหมด
func (c *NotificationController) MarkAllAsRead(ctx *gin.Context) {
	accountID, exists := ctx.Get("user_id")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	member, err := c.MemberService.GetProfileByAccountID(accountID.(uint))
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "member profile not found"})
		return
	}

	if err := c.Repo.MarkAllAsRead(member.ID); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "all notifications marked as read"})
}

// DELETE /api/member/notifications/read - ลบที่อ่านแล้ว
func (c *NotificationController) DeleteRead(ctx *gin.Context) {
	accountID, exists := ctx.Get("user_id")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	member, err := c.MemberService.GetProfileByAccountID(accountID.(uint))
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "member profile not found"})
		return
	}

	if err := c.Repo.DeleteRead(member.ID); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "read notifications deleted"})
}
