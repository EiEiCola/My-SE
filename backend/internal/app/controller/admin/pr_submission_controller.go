package controller

import (
	"net/http"
	"strconv"
	"time"

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
	var memberID *uint
	if m := c.Query("member_id"); m != "" {
		if id64, err := strconv.ParseUint(m, 10, 32); err == nil {
			uid := uint(id64)
			memberID = &uid
		}
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

// GET /admin/pr-submissions/:id
func (ctl *AdminPRController) GetByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	sub, err := ctl.SubmissionService.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, sub)
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

type updatePRRequest struct {
	Title      string  `json:"title" binding:"required"`
	Content    string  `json:"content" binding:"required"`
	ReqStartAt *string `json:"req_start_at"`
	ReqEndAt   *string `json:"req_end_at"`
}

// PUT /admin/pr-submissions/:id
func (ctl *AdminPRController) Update(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var req updatePRRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var start, end *time.Time
	if req.ReqStartAt != nil {
		if t, err := time.Parse(time.RFC3339, *req.ReqStartAt); err == nil {
			start = &t
		}
	}
	if req.ReqEndAt != nil {
		if t, err := time.Parse(time.RFC3339, *req.ReqEndAt); err == nil {
			end = &t
		}
	}

	if err := ctl.SubmissionService.UpdateSubmission(id, req.Title, req.Content, start, end); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "updated"})
}

// DELETE /admin/pr-submissions/:id
func (ctl *AdminPRController) Delete(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	if err := ctl.SubmissionService.DeleteSubmission(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "deleted"})
}
