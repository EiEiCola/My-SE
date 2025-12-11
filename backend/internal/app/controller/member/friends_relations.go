package controller

import (
	"net/http"

	"github.com/sut68/team12/backend/internal/dto"
	"github.com/sut68/team12/backend/internal/app/services"

	"github.com/gin-gonic/gin"
)

type FriendshipController struct {
	Service *services.FriendService
}

func NewFriendshipController(s *services.FriendService) *FriendshipController {
	return &FriendshipController{Service: s}
}

func (ctl *FriendshipController) Unfriend(c *gin.Context) {
	var body dto.UnfriendDTO
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": ctl.Service.Unfriend(body)})
}
