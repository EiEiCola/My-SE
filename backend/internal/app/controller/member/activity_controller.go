package controller

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/internal/app/repository"
)

type ActivityController struct {
	memberRepo repository.MemberRepository
}

func NewActivityController(memberRepo repository.MemberRepository) *ActivityController {
	return &ActivityController{memberRepo: memberRepo}
}

// Heartbeat endpoint to update user's last activity
// POST /api/member/heartbeat
func (c *ActivityController) Heartbeat(ctx *gin.Context) {
	memberID, exists := ctx.Get("memberID")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Update last activity timestamp
	err := c.memberRepo.UpdateLastActivity(memberID.(uint))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update activity"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Activity updated"})
}
