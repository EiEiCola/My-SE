package controller

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/internal/app/services"
)

type PointRuleController struct {
	pointRuleService services.PointRuleService
}

func NewPointRuleController(s services.PointRuleService) *PointRuleController {
	return &PointRuleController{
		pointRuleService: s,
	}
}

func (c *PointRuleController) GetAllPointRule(ctx *gin.Context) {

	rules, err := c.pointRuleService.GetAllPointRule()

	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, rules)
}
