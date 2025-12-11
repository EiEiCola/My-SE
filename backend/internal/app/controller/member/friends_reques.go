package controller

import (
	"net/http"
	 
	"github.com/sut68/team12/backend/internal/dto"
	"github.com/sut68/team12/backend/internal/app/services"

	"github.com/gin-gonic/gin"
)

type FriendRequestController struct {
	Service *services.FriendService
}

func NewFriendRequestController(s *services.FriendService) *FriendRequestController {
	return &FriendRequestController{Service: s}
}

func (ctl *FriendRequestController) Send(c *gin.Context) {
	var body dto.SendRequestDTO
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": ctl.Service.SendRequest(body)})
}

func (ctl *FriendRequestController) Respond(c *gin.Context) {
	var body dto.RespondRequestDTO
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": ctl.Service.RespondRequest(body)})
}

func (ctl *FriendRequestController) Cancel(c *gin.Context) {
	var body dto.CancelRequestDTO
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": ctl.Service.CancelRequest(body)})
}
