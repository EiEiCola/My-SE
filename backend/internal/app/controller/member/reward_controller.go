package controller

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/internal/app/services"
)

type RewardController struct {
	rewardService services.RewardService
}

func NewRewardController(s services.RewardService) *RewardController {
	return &RewardController{
		rewardService: s,
	}
}

// User ดูรายการ reward
func (c *RewardController) GetAllReward(ctx *gin.Context) {

	rewards, err := c.rewardService.GetAllReward()

	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, rewards)
}
