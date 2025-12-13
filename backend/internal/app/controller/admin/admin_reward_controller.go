package controller

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/internal/app/services"
	"github.com/sut68/team12/backend/internal/entity"
)

type AdminRewardController struct {
	adminRewardService services.AdminRewardService
}

func NewAdminRewardController(s services.AdminRewardService) *AdminRewardController {
	return &AdminRewardController{
		adminRewardService: s,
	}
}

func (c *AdminRewardController) CreateReward(ctx *gin.Context) {
	var req entity.Reward

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := c.adminRewardService.CreateReward(&req)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, result)
}

func (c *AdminRewardController) UpdateReward(ctx *gin.Context) {
	idStr := ctx.Param("id") // ✅ ต้องเป็น "id"
	idU64, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil || idU64 == 0 {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	id := uint(idU64)

	var req entity.Reward
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := c.adminRewardService.UpdateReward(id, &req)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, result)
}

func (c *AdminRewardController) DeleteReward(ctx *gin.Context) {
	idStr := ctx.Param("id") // ✅ ต้องเป็น "id"
	idU64, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil || idU64 == 0 {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	id := uint(idU64)

	println("DELETE id =", id)

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

	ctx.JSON(http.StatusOK, result)
}

func (c *AdminRewardController) GetRewardByID(ctx *gin.Context) {
	idStr := ctx.Param("id") // ✅ ต้องเป็น "id"
	idU64, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil || idU64 == 0 {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	id := uint(idU64)

	result, err := c.adminRewardService.GetRewardByID(id)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, result)
}
