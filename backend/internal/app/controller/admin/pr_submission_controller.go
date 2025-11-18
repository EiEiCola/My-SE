package controller

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/internal/app/services"
)

type AdminPRController struct {
	SubmissionService *services.PRSubmissionService
	ReviewService     *services.PRReviewService
}

func NewAdminPRController(subSvc *services.PRSubmissionService, revSvc *services.PRReviewService) *AdminPRController {
	return &AdminPRController{SubmissionService: subSvc, ReviewService: revSvc}
}

type reviewRequest struct {
	StatusID           int    `json:"status_id" binding:"required"`
	Comment            string `json:"comment"`
	CreateAnnouncement bool   `json:"create_announcement"`
}

// GET /admin/pr-submissions
func (ctl *AdminPRController) List(c *gin.Context) {
	page := 1
	pageSize := 20
	if p := c.Query("page"); p != "" {
		if n, err := strconv.Atoi(p); err == nil {
			page = n
		}
	}
	if ps := c.Query("page_size"); ps != "" {
		if n, err := strconv.Atoi(ps); err == nil {
			pageSize = n
		}
	}
	var memberID *string
	if m := c.Query("member_id"); m != "" {
		memberID = &m
	}
	var statusID *int
	if s := c.Query("status_id"); s != "" {
		if n, err := strconv.Atoi(s); err == nil {
			statusID = &n
		}
	}
	q := c.Query("q")

	items, total, err := ctl.SubmissionService.AdminListSubmissions(page, pageSize, memberID, statusID, q)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": items, "total": total})
}

// POST /admin/pr-submissions/:id/review
func (ctl *AdminPRController) Review(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var req reviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	val, ok := c.Get("admin_id")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing admin id"})
		return
	}
	adminID := 0
	switch v := val.(type) {
	case int:
		adminID = v
	case string:
		if n, err := strconv.Atoi(v); err == nil {
			adminID = n
		}
	}

	if err := ctl.ReviewService.ReviewSubmission(adminID, id, req.StatusID, req.Comment, req.CreateAnnouncement); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}
