package controller

import (
	"net/http"
	"github.com/sut68/team12/backend/internal/dto"
	"github.com/sut68/team12/backend/internal/app/services"
	"github.com/gin-gonic/gin"
)

type FollowController struct {
	Service *services.FriendService
}

func NewFollowController(s *services.FriendService) *FollowController {
	return &FollowController{Service: s}
}

func (ctl *FollowController) Follow(c *gin.Context) {
	var body dto.FollowDTO
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": ctl.Service.Follow(body)})
}

func (ctl *FollowController) Unfollow(c *gin.Context) {
	var body dto.UnfollowDTO
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": ctl.Service.Unfollow(body)})
}

// Mute 
func (ctl *FollowController) Mute(c *gin.Context) {
	var body dto.MuteDTO
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": ctl.Service.Mute(body)})
}

// Unmute
func (ctl *FollowController) Unmute(c *gin.Context) {
	var body dto.UnmuteDTO
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": ctl.Service.Unmute(body)})
}