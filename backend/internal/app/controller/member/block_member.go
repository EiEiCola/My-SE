package controller

import (
	"net/http"
	"strconv"

	
	"github.com/sut68/team12/backend/internal/app/services"

	"github.com/gin-gonic/gin"
)

type BlockController struct {
	FriendService *services.FriendService
}

func NewBlockController(s *services.FriendService) *BlockController {
	return &BlockController{FriendService: s}
}

// POST /members/:id/block/:targetID
func (ctl *BlockController) BlockMember(c *gin.Context) {
	blockerID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid blocker id"})
		return
	}

	targetID, err := strconv.Atoi(c.Param("targetID"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid target id"})
		return
	}

	block, err := ctl.FriendService.BlockMember(blockerID, targetID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"block": block})
}

// DELETE /members/:id/block/:targetID
func (ctl *BlockController) UnblockMember(c *gin.Context) {
	blockerID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid blocker id"})
		return
	}

	targetID, err := strconv.Atoi(c.Param("targetID"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid target id"})
		return
	}

	if err := ctl.FriendService.UnblockMember(blockerID, targetID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "unblocked successfully"})
}
