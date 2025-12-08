package controller

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/internal/app/services"
)

type PointTransactionController struct {
	pointTransactionService services.PointTransactionService
}

func NewPointTransactionController(s services.PointTransactionService) *PointTransactionController {
	return &PointTransactionController{
		pointTransactionService: s,
	}
}

// สร้าง Point Transaction (สะสมแต้ม)
func (c *PointTransactionController) CreatePointTransaction(ctx *gin.Context) {

	var req struct {
		MemberID    uint `json:"member_id" binding:"required"`
		PointRuleID uint `json:"point_rule_id" binding:"required"`
		PostID      uint `json:"post_id"`
		PollID      uint `json:"poll_id"`
		ReviewID    uint `json:"review_id"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	refIDs := map[string]uint{
		"post_id":   req.PostID,
		"poll_id":   req.PollID,
		"review_id": req.ReviewID,
	}

	tx, err := c.pointTransactionService.CreatePointTransaction(req.MemberID, req.PointRuleID, refIDs)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, tx)
}

// ดูประวัติแต้มของ user
func (c *PointTransactionController) GetPointTransactionByMemberID(ctx *gin.Context) {

	memberIDParam := ctx.Param("member_id")
	memberIDUint, err := strconv.ParseUint(memberIDParam, 10, 64)

	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid member_id"})
		return
	}

	data, err := c.pointTransactionService.GetPointTransactionByMemberID(uint(memberIDUint))

	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, data)
}
