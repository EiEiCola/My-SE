package controller

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/internal/app/services"
	"github.com/sut68/team12/backend/internal/entity"
)

type PointRuleController struct {
	pointRuleService services.PointRuleService
}

func NewPointRuleController(s services.PointRuleService) *PointRuleController {
	return &PointRuleController{pointRuleService: s}
}

func (c *PointRuleController) GetAll(ctx *gin.Context) {
	rules, err := c.pointRuleService.GetAll()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, rules)
}

func (c *PointRuleController) GetByID(ctx *gin.Context) {
	idU64, err := strconv.ParseUint(ctx.Param("id"), 10, 64)
	if err != nil || idU64 == 0 {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	rule, err := c.pointRuleService.GetByID(uint(idU64))
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, rule)
}

func (c *PointRuleController) Create(ctx *gin.Context) {
	var req entity.PointRule
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	rule, err := c.pointRuleService.Create(&req)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, rule)
}

func (c *PointRuleController) Update(ctx *gin.Context) {
	idU64, err := strconv.ParseUint(ctx.Param("id"), 10, 64)
	if err != nil || idU64 == 0 {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var req entity.PointRule
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	rule, err := c.pointRuleService.Update(uint(idU64), &req)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, rule)
}

func (c *PointRuleController) Delete(ctx *gin.Context) {
	idU64, err := strconv.ParseUint(ctx.Param("id"), 10, 64)
	if err != nil || idU64 == 0 {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	if err := c.pointRuleService.Delete(uint(idU64)); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Point rule deleted"})
}
