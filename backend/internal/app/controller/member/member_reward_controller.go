package controller

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/config"
	"github.com/sut68/team12/backend/internal/app/services"
	"github.com/sut68/team12/backend/internal/entity"
)

type MemberRewardController struct {
	svc services.MemberRewardService
}

func NewMemberRewardController(s services.MemberRewardService) *MemberRewardController {
	return &MemberRewardController{svc: s}
}

// ✅ helper: get account id from context (token middleware set ไว้)
func getAccountIDFromCtx(ctx *gin.Context) (uint, bool) {
	// middleware ส่วนใหญ่จะ set เป็น user_id = member_account_id
	v, ok := ctx.Get("user_id")
	if !ok {
		v, ok = ctx.Get("account_id")
	}
	if !ok {
		return 0, false
	}

	switch t := v.(type) {
	case uint:
		return t, true
	case int:
		if t > 0 {
			return uint(t), true
		}
	case int64:
		if t > 0 {
			return uint(t), true
		}
	case float64:
		if t > 0 {
			return uint(t), true
		}
	case string:
		n, err := strconv.ParseUint(t, 10, 64)
		if err == nil && n > 0 {
			return uint(n), true
		}
	}
	return 0, false
}

// ✅ map account_id -> member_id (members.id)
func resolveMemberIDByAccountID(accountID uint) (uint, error) {
	var m entity.Member
	if err := config.DB.
		Select("id").
		Where("member_account_id = ?", accountID).
		First(&m).Error; err != nil {
		return 0, err
	}
	return m.ID, nil
}

// ✅ helper: get real member id for this request
func getMemberIDFromCtx(ctx *gin.Context) (uint, bool) {
	accountID, ok := getAccountIDFromCtx(ctx)
	if !ok || accountID == 0 {
		return 0, false
	}

	memberID, err := resolveMemberIDByAccountID(accountID)
	if err != nil || memberID == 0 {
		return 0, false
	}
	return memberID, true
}

// POST /member/rewards/:id/redeem
func (c *MemberRewardController) Redeem(ctx *gin.Context) {
	memberID, ok := getMemberIDFromCtx(ctx)
	if !ok || memberID == 0 {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

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
	memberID, ok := getMemberIDFromCtx(ctx)
	if !ok || memberID == 0 {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	items, err := c.svc.MyStickers(memberID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, items)
}

// GET /member/points
func (c *MemberRewardController) MyPoints(ctx *gin.Context) {
	memberID, ok := getMemberIDFromCtx(ctx)
	if !ok || memberID == 0 {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	p, err := c.svc.MyPoints(memberID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"total_point": p})
}
