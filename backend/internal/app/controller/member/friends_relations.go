package controller

import (
	"net/http"
	"strconv"

	"github.com/sut68/team12/backend/internal/app/services"

	"github.com/gin-gonic/gin"
)

type FriendshipController struct {
	FriendService *services.FriendService
}

func NewFriendshipController(s *services.FriendService) *FriendshipController {
	return &FriendshipController{FriendService: s}
}

// GET /members/:id/friends
func (ctl *FriendshipController) GetFriends(c *gin.Context) {
	memberID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid member id"})
		return
	}

	friends, err := ctl.FriendService.GetFriends(memberID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"friends": friends})
}

// DELETE /members/:id/friends/:targetID
func (ctl *FriendshipController) Unfriend(c *gin.Context) {
	memberID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid member id"})
		return
	}

	targetID, err := strconv.Atoi(c.Param("targetID"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid target id"})
		return
	}

	if err := ctl.FriendService.Unfriend(memberID, targetID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "unfriended successfully"})
}
