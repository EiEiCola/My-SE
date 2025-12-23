package controller

import (
	"net/http"

	"github.com/sut68/team12/backend/internal/app/services"
	"github.com/sut68/team12/backend/internal/dto"

	"github.com/gin-gonic/gin"
)

type BlockController struct {
	Service *services.FriendService
}

func NewBlockController(s *services.FriendService) *BlockController {
	return &BlockController{Service: s}
}

func (ctl *BlockController) Block(c *gin.Context) {
	var body dto.BlockDTO
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": ctl.Service.Block(body)})
}

func (ctl *BlockController) Unblock(c *gin.Context) {
	var body dto.UnblockDTO
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": ctl.Service.Unblock(body)})
}

// GetMyBlockedList เรียกดูรายการคนที่ User เคยบล็อกไว้
func (ctl *BlockController) GetMyBlockedList(c *gin.Context) {
	memberID := 1
	blocked, err := ctl.Service.Repo.GetBlockedUsers(memberID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, blocked)
}
