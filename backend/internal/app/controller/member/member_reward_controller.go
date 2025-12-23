package controller

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/internal/app/services"
)

type MemberRewardController struct {
	svc services.MemberRewardService
}

func NewMemberRewardController(s services.MemberRewardService) *MemberRewardController {
	return &MemberRewardController{svc: s}
}

// ✅ DEV MODE: fix member id
const DEV_MEMBER_ID uint = 1

// POST /member/rewards/:id/redeem
func (c *MemberRewardController) Redeem(ctx *gin.Context) {
	memberID := DEV_MEMBER_ID

	rewardIDStr := ctx.Param("id")
	rewardID64, err := strconv.ParseUint(rewardIDStr, 10, 64)
	if err != nil || rewardID64 == 0 {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid reward id"})
		return
	}
	rewardID := uint(rewardID64)

	idemKey := ctx.GetHeader("x-idempotency-key")

	newBal, memberRewardID, err := c.svc.Redeem(memberID, rewardID, idemKey)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message":           "redeem success",
		"new_point_balance": newBal,
		"member_reward_id":  memberRewardID,
		"reward_id":         rewardID,
	})
}

// GET /member/my-stickers
func (c *MemberRewardController) MyStickers(ctx *gin.Context) {
	memberID := DEV_MEMBER_ID

	items, err := c.svc.MyStickers(memberID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, items)
}

// ✅ เพิ่ม: GET /member/points
func (c *MemberRewardController) MyPoints(ctx *gin.Context) {
	memberID := DEV_MEMBER_ID

	p, err := c.svc.MyPoints(memberID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"total_point": p,
	})
}
