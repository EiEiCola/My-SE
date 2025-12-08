package controller

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/internal/app/services"
)

type MemberPointBalanceController struct {
	memberPointBalanceService services.MemberPointBalanceService
}

func NewMemberPointBalanceController(s services.MemberPointBalanceService) *MemberPointBalanceController {
	return &MemberPointBalanceController{
		memberPointBalanceService: s,
	}
}

// ดูยอดแต้ม user
func (c *MemberPointBalanceController) GetMemberPointBalanceByMemberID(ctx *gin.Context) {

	memberIDParam := ctx.Param("member_id")
	memberIDUint, err := strconv.ParseUint(memberIDParam, 10, 64)

	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid member_id"})
		return
	}

	balance, err := c.memberPointBalanceService.GetMemberPointBalanceByMemberID(uint(memberIDUint))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, balance)
}
