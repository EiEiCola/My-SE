package controller

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/internal/entity" // ⭐ เช็ค Path
	"github.com/sut68/team12/backend/internal/app/services"
	"github.com/sut68/team12/backend/internal/dto"
)

type FollowController struct {
	Service *services.FriendService
}

func NewFollowController(s *services.FriendService) *FollowController {
	return &FollowController{Service: s}
}

// Helper: แปลง Account ID -> Member ID
func (c *FollowController) getMemberID(ctx *gin.Context) (int, error) {
	accountID := ctx.MustGet("user_id").(uint)
	var member entity.Member
	if err := c.Service.Repo.DB.Where("member_account_id = ?", accountID).First(&member).Error; err != nil {
		return 0, err
	}
	return int(member.ID), nil
}

// Follow: ติดตาม
func (c *FollowController) Follow(ctx *gin.Context) {
	var body dto.FollowDTO
	if err := ctx.ShouldBindJSON(&body); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	memberID, err := c.getMemberID(ctx)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Member profile not found"})
		return
	}
	body.FollowerID = memberID // ✅ ใส่ ID จาก Token

	if err := c.Service.Follow(body); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusCreated, gin.H{"message": "Followed successfully"})
}

// Unfollow: เลิกติดตาม (ใช้ PUT ตาม Routes)
func (c *FollowController) Unfollow(ctx *gin.Context) {
	targetIDStr := ctx.Param("target_id")
	followedID, err := strconv.Atoi(targetIDStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid target ID"})
		return
	}

	memberID, err := c.getMemberID(ctx)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Member profile not found"})
		return
	}

	dto := dto.UnfollowDTO{FollowerID: memberID, FollowedID: followedID}
	
	// หมายเหตุ: Service Unfollow ของคุณใช้อัปเดตสถานะเป็น 3
	if err := c.Service.Unfollow(dto); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "Unfollowed successfully"})
}

// Mute
func (c *FollowController) Mute(ctx *gin.Context) {
	targetIDStr := ctx.Param("target_id")
	followedID, err := strconv.Atoi(targetIDStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid target ID"})
		return
	}

	memberID, err := c.getMemberID(ctx)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Member profile not found"})
		return
	}

	dto := dto.MuteDTO{FollowerID: memberID, FollowedID: followedID}
	if err := c.Service.Mute(dto); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "Muted successfully"})
}

// Unmute
func (c *FollowController) Unmute(ctx *gin.Context) {
	targetIDStr := ctx.Param("target_id")
	followedID, err := strconv.Atoi(targetIDStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid target ID"})
		return
	}

	memberID, err := c.getMemberID(ctx)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Member profile not found"})
		return
	}

	dto := dto.UnmuteDTO{FollowerID: memberID, FollowedID: followedID}
	if err := c.Service.Unmute(dto); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "Unmuted successfully"})
}