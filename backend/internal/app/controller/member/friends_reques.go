package controller

import (
	"net/http"
	"strconv"

	"github.com/sut68/team12/backend/internal/app/services"

	"github.com/gin-gonic/gin"
)

type FriendRequestController struct {
	FriendService *services.FriendService
}

func NewFriendRequestController(s *services.FriendService) *FriendRequestController {
	return &FriendRequestController{FriendService: s}
}

// POST /members/:id/friend-requests
func (ctl *FriendRequestController) SendFriendRequest(c *gin.Context) {
	senderID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid member id"})
		return
	}

	var body struct {
		TargetMemberID int `json:"target_member_id"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid json"})
		return
	}

	rf, err := ctl.FriendService.SendFriendRequest(senderID, body.TargetMemberID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"friend_request": rf})
}

// POST /friend-requests/:id/accept
func (ctl *FriendRequestController) AcceptFriendRequest(c *gin.Context) {
	reqID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request id"})
		return
	}

	rel, err := ctl.FriendService.AcceptFriendRequest(reqID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "friend request accepted", "relation": rel})
}

// POST /friend-requests/:id/reject
func (ctl *FriendRequestController) RejectFriendRequest(c *gin.Context) {
	reqID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request id"})
		return
	}

	if err := ctl.FriendService.RejectFriendRequest(reqID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "friend request rejected"})
}

// DELETE /friend-requests/:id
func (ctl *FriendRequestController) CancelFriendRequest(c *gin.Context) {
	reqID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request id"})
		return
	}

	if err := ctl.FriendService.CancelFriendRequest(reqID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "friend request canceled"})
}
