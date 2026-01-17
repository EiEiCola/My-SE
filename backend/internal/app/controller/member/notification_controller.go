package controller

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/internal/app/repository"
)

type NotificationController struct {
	Repo *repository.NotificationRepository
}

func NewNotificationController(repo *repository.NotificationRepository) *NotificationController {
	return &NotificationController{Repo: repo}
}

// GET /api/notifications
func (c *NotificationController) GetNotifications(ctx *gin.Context) {
	userID, exists := ctx.Get("user_id")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	notifications, err := c.Repo.GetByUserID(userID.(uint))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": notifications})
}

// PATCH /api/notifications/:id/read
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
