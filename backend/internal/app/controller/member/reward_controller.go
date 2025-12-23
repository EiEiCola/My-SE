package controller

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/internal/app/services"
	"gorm.io/gorm"
)

type RewardController struct {
	svc services.RewardService
}

func NewRewardController(s services.RewardService) *RewardController {
	return &RewardController{svc: s}
}

func (c *RewardController) GetAllReward(ctx *gin.Context) {
	rewards, err := c.svc.GetAllReward()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, rewards)
}

func (c *RewardController) GetRewardByID(ctx *gin.Context) {
	idStr := ctx.Param("id")
	idU64, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil || idU64 == 0 {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	id := uint(idU64)

	reward, err := c.svc.GetRewardByID(id)
	if err != nil {
		// ✅ ถ้าเป็น record not found ให้ตอบ 404
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "reward not found"})
			return
		}
		// ✅ error อื่น ๆ
		if err.Error() == "invalid id" {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, reward)
}
