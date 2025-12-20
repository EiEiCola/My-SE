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

/* =========================
   DRAFT MANAGEMENT
========================= */

// SaveDraft: บันทึกโพลเป็น DRAFT
func (ctl *PollController) SaveDraft(c *gin.Context) {
	var req dto.CreatePollRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body", "detail": err.Error()})
		return
	}

	memberID, ok := getMemberID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	res, err := ctl.pollService.SaveDraft(memberID, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, res)
}

// UpdateDraft: แก้ไขโพล (DRAFT หรือ REJECTED)
func (ctl *PollController) UpdateDraft(c *gin.Context) {
	pollID, err := parseUintParam(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid poll id"})
		return
	}

	var req dto.UpdatePollRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body", "detail": err.Error()})
		return
	}

	memberID, ok := getMemberID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	res, err := ctl.pollService.UpdateDraft(memberID, pollID, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, res)
}

// SubmitForReview: ส่งโพลให้แอดมินตรวจ
func (ctl *PollController) SubmitForReview(c *gin.Context) {
	pollID, err := parseUintParam(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid poll id"})
		return
	}

	memberID, ok := getMemberID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	res, err := ctl.pollService.SubmitForReview(memberID, pollID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, res)
}

// CancelRequest: ยกเลิกคำขอ
func (ctl *PollController) CancelRequest(c *gin.Context) {
	pollID, err := parseUintParam(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid poll id"})
		return
	}

	memberID, ok := getMemberID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	res, err := ctl.pollService.CancelRequest(memberID, pollID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, res)
}

// DeletePoll: ลบโพล (DRAFT หรือ REJECTED)
func (ctl *PollController) DeletePoll(c *gin.Context) {
	pollID, err := parseUintParam(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid poll id"})
		return
	}

	memberID, ok := getMemberID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	err = ctl.pollService.DeletePoll(memberID, pollID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "poll deleted successfully"})
}

/* =========================
   MY POLLS
========================= */

// GetMyPolls: ดูโพลของตัวเอง
func (ctl *PollController) GetMyPolls(c *gin.Context) {
	memberID, ok := getMemberID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	// Optional status filter
	var statusID *uint
	if s := c.Query("status_id"); s != "" {
		v, err := strconv.ParseUint(s, 10, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid status_id"})
			return
		}
		tmp := uint(v)
		statusID = &tmp
	}

	res, err := ctl.pollService.GetMyPolls(memberID, statusID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if res == nil {
		res = []dto.MyPollsResponse{}
	}

	c.JSON(http.StatusOK, res)
}

// GetMyPollByID: ดูโพลของตัวเอง (รายละเอียด)
func (ctl *PollController) GetMyPollByID(c *gin.Context) {
	pollID, err := parseUintParam(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid poll id"})
		return
	}

	memberID, ok := getMemberID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	res, err := ctl.pollService.GetMyPollByID(memberID, pollID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, res)
}

/* =========================
   PUBLIC (EXISTING)
========================= */

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

	res, err := ctl.pollService.Results(memberID, pollID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, res)
}
	