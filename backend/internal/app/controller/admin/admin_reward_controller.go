package controller

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/internal/app/services"
	"github.com/sut68/team12/backend/internal/entity"
	"gorm.io/gorm"
)

type AdminRewardController struct {
	adminRewardService services.AdminRewardService
}

func NewAdminRewardController(s services.AdminRewardService) *AdminRewardController {
	return &AdminRewardController{
		adminRewardService: s,
	}
}

// ✅ DTO: ไม่รับ admin_id จาก client
type RewardRequest struct {
	RewardName    string `json:"reward_name"`
	PointRequired int    `json:"point_required"`
	RewardPicture string `json:"reward_picture"`
}

func getUserIDFromCtx(ctx *gin.Context) (uint, bool) {
	v, ok := ctx.Get("user_id")
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
	case float64:
		if t > 0 {
			return uint(t), true
		}
	}

	return 0, false
}

func (c *AdminRewardController) CreateReward(ctx *gin.Context) {
	var req RewardRequest

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ✅ ดึง admin id จาก JWT middleware
	adminID, ok := getUserIDFromCtx(ctx)
	if !ok || adminID == 0 {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "missing token context"})
		return
	}

	reward := entity.Reward{
		RewardName:    req.RewardName,
		PointRequired: req.PointRequired,
		RewardPicture: req.RewardPicture,
		AdminID:       adminID, // ⭐ สำคัญ: set จาก token
	}

	result, err := c.adminRewardService.CreateReward(&reward)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, result)
}

func (c *AdminRewardController) UpdateReward(ctx *gin.Context) {
	idStr := ctx.Param("id")
	idU64, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil || idU64 == 0 {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	id := uint(idU64)

	var req RewardRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ✅ ดึง admin id จาก token (ไว้ตรวจสิทธิ์/บันทึกคนแก้)
	adminID, ok := getUserIDFromCtx(ctx)
	if !ok || adminID == 0 {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "missing token context"})
		return
	}

	reward := entity.Reward{
		RewardName:    req.RewardName,
		PointRequired: req.PointRequired,
		RewardPicture: req.RewardPicture,
		AdminID:       adminID, // หมายเหตุ: repo ของคุณไม่ได้ update admin_id แล้ว (ดี)
	}

	result, err := c.adminRewardService.UpdateReward(id, &reward)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, result)
}

func (c *AdminRewardController) DeleteReward(ctx *gin.Context) {
	idStr := ctx.Param("id")
	idU64, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil || idU64 == 0 {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	id := uint(idU64)

	if err := c.adminRewardService.DeleteReward(id); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Reward deleted"})
}

func (c *AdminRewardController) GetAllReward(ctx *gin.Context) {
	result, err := c.adminRewardService.GetAllReward()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// ✅ ส่งเป็น array ตรง ๆ เพื่อให้ frontend ใช้ง่าย
	ctx.JSON(http.StatusOK, result)
}

func (c *AdminRewardController) GetRewardByID(ctx *gin.Context) {
	idStr := ctx.Param("id")
	idU64, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil || idU64 == 0 {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	id := uint(idU64)

	result, err := c.adminRewardService.GetRewardByID(id)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "reward not found"})
			return
		}
		ctx.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, result)
}
