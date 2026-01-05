package controller

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"
	//"github.com/sut68/team12/backend/config"
    //"github.com/sut68/team12/backend/internal/entity"
    
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

	memberID, ok := getMemberIDForPoll(c)
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

	memberID, ok := getMemberIDForPoll(c)
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

	memberID, ok := getMemberIDForPoll(c)
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

	memberID, ok := getMemberIDForPoll(c)
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

	memberID, ok := getMemberIDForPoll(c)
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
	memberID, ok := getMemberIDForPoll(c)

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

	memberID, ok := getMemberIDForPoll(c)

	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	res, err := ctl.pollService.GetMyPollByID(memberID, pollID)
if err != nil {
    if err.Error() == "you are not the owner of this poll" {
        c.JSON(http.StatusForbidden, gin.H{
            "error": err.Error(),
            "member_id_from_token": memberID,
            "poll_id": pollID,
        })
        return
    }

    c.JSON(http.StatusBadRequest, gin.H{
        "error": err.Error(),
        "member_id_from_token": memberID,
        "poll_id": pollID,
    })
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

	memberID, ok := getMemberIDForPoll(c)

if !ok {
  c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
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
  memberID, ok := getMemberIDForPoll(c)
  if !ok {
    c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
    return
  }

  res, err := ctl.pollService.ListPublished(memberID)
  if err != nil {
    c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
    return
  }
  c.JSON(http.StatusOK, res)
}

// ✅ GET /api/member/polls/:id
func (ctl *PollController) GetPublishedByID(c *gin.Context) {
	pollID, err := parseUintParam(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid poll id"})
		return
	}

	memberID, ok := getMemberIDForPoll(c)

	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	res, err := ctl.pollService.GetPublishedByID(memberID, pollID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, res)
}

// ✅ GET /api/member/polls/:id/my-vote
func (ctl *PollController) GetMyVote(c *gin.Context) {
	pollID, err := parseUintParam(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid poll id"})
		return
	}
  
   memberID, ok := getMemberIDForPoll(c)

	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	res, err := ctl.pollService.GetMyVote(memberID, pollID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
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

	memberID, ok := getMemberIDForPoll(c)
if !ok {
  c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
  return
}

	res, err := ctl.pollService.Vote(memberID, pollID, req)
	if err != nil {
	switch err.Error() {
	case "poll_closed", "poll_not_started", "poll_not_open", "already_voted", "owner_cannot_vote":
		
    c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})

	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
	}
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

	memberID, ok := getMemberIDForPoll(c)
if !ok {
  c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
  return
}

	res, err := ctl.pollService.Results(memberID, pollID)
if err != nil {
  switch err.Error() {
  case "must_vote_to_see_results", "results_not_available":
    c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
  default:
    c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
  }
  return
}
c.JSON(http.StatusOK, res)}

// ✅ POST /api/member/polls/options/upload (multipart/form-data)
// form key: file
func (ctl *PollController) UploadOptionImage(c *gin.Context) {
	_, ok := getMemberID(c) // แค่เช็คว่า login อยู่
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	f, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no file uploaded (key must be 'file')"})
		return
	}

	ext := strings.ToLower(filepath.Ext(f.Filename))
	if ext == "" {
		ext = ".jpg"
	}
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".webp" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "unsupported file type", "filename": f.Filename})
		return
	}

	saveDir := filepath.Join("uploads", "polls", "options")
	if err := os.MkdirAll(saveDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot create upload dir", "detail": err.Error()})
		return
	}

	rb := make([]byte, 8)
	_, _ = rand.Read(rb)
	name := hex.EncodeToString(rb) + "_" + strconv.FormatInt(time.Now().UnixNano(), 10) + ext

	dst := filepath.Join(saveDir, name)
	if err := c.SaveUploadedFile(f, dst); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "save file failed", "detail": err.Error()})
		return
	}

	publicURL := "/uploads/polls/options/" + name
	c.JSON(http.StatusCreated, gin.H{
		"message": "image uploaded",
		"url":     publicURL,
	})
}
//heple

func getMemberIDForPoll(c *gin.Context) (uint, bool) {
  uidAny, ok := c.Get("user_id")
  if !ok {
    return 0, false
  }

  switch v := uidAny.(type) {
  case uint:
    return v, v > 0
  case int:
    if v <= 0 { return 0, false }
    return uint(v), true
  case float64:
    if v <= 0 { return 0, false }
    return uint(v), true
  default:
    return 0, false
  }
}
