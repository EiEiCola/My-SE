package controller

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/internal/app/services"
)

type MemberRewardController struct {
	memberRewardService services.MemberRewardService
}

func NewMemberRewardController(s services.MemberRewardService) *MemberRewardController {
	return &MemberRewardController{
		memberRewardService: s,
	}
}

// User Redeem Reward
func (c *MemberRewardController) RedeemMemberReward(ctx *gin.Context) {

	var req struct {
		MemberID uint `json:"member_id" binding:"required"`
		RewardID uint `json:"reward_id" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	mr, err := c.memberRewardService.RedeemMemberReward(req.MemberID, req.RewardID)

	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, mr)
}

// User ดูประวัติ reward ที่แลก
func (c *MemberRewardController) GetMemberRewardByMemberID(ctx *gin.Context) {

	memberIDParam := ctx.Param("member_id")
	memberIDUint, err := strconv.ParseUint(memberIDParam, 10, 64)

	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid member_id"})
		return
	}

	rewards, err := c.memberRewardService.GetMemberRewardByMemberID(uint(memberIDUint))

	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, rewards)
}
