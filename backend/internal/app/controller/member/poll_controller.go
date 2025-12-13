package controller

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/internal/app/services"
	"github.com/sut68/team12/backend/internal/dto"
)

type PollController struct {
	pollService services.PollService
}

func NewPollController(pollService services.PollService) *PollController {
	return &PollController{pollService: pollService}
}

func (ctl *PollController) CreateRequest(c *gin.Context) {
	var req dto.CreatePollRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body", "detail": err.Error()})
		return
	}

	memberIDAny, ok := c.Get("member_id")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "member_id not found"})
		return
	}
	memberID, ok := memberIDAny.(uint)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid member_id type"})
		return
	}

	res, err := ctl.pollService.CreateRequest(memberID, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, res)
}

func (ctl *PollController) ListPublished(c *gin.Context) {
	res, err := ctl.pollService.ListPublished()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, res)
}

func (ctl *PollController) Vote(c *gin.Context) {
	pollID64, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid poll id"})
		return
	}
	pollID := uint(pollID64)

	var req dto.VotePollRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body", "detail": err.Error()})
		return
	}

	memberIDAny, ok := c.Get("member_id")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "member_id not found"})
		return
	}
	memberID, ok := memberIDAny.(uint)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid member_id type"})
		return
	}

	res, err := ctl.pollService.Vote(memberID, pollID, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, res)
}

func (ctl *PollController) Results(c *gin.Context) {
	pollID64, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid poll id"})
		return
	}
	pollID := uint(pollID64)

	res, err := ctl.pollService.Results(pollID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, res)
}
