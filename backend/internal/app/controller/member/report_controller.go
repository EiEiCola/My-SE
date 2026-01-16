package controller

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/internal/app/services"
	"github.com/sut68/team12/backend/internal/utils"
)

type MemberReportController struct {
	Service *services.ReportService
}

func NewMemberReportController(s *services.ReportService) *MemberReportController {
	return &MemberReportController{Service: s}
}

type createReportRequest struct {
	TargetType  string                      `json:"target_type" binding:"required"`
	TargetID    *uint                       `json:"target_id"`
	Title       string                      `json:"title" binding:"required"`
	Description string                      `json:"description" binding:"required"`
	Medias      []services.ReportMediaInput `json:"medias"`
}

// POST /member/reports
func (ctl *MemberReportController) Create(c *gin.Context) {
	var req createReportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	memberID, err := utils.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	in := &services.CreateReportInput{
		TargetType:  req.TargetType,
		TargetID:    req.TargetID,
		Title:       req.Title,
		Description: req.Description,
		Medias:      req.Medias,
	}
	rep, err := ctl.Service.CreateReport(memberID, in)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, rep)
}

// GET /member/reports
func (ctl *MemberReportController) List(c *gin.Context) {
	memberID, err := utils.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

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
	var statusID *int
	if s := c.Query("status_id"); s != "" {
		if n, err := strconv.Atoi(s); err == nil {
			statusID = &n
		}
	}
	targetType := c.Query("target_type")
	q := c.Query("q")

	items, total, err := ctl.Service.ListByReporter(memberID, page, pageSize, statusID, targetType, q)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": items, "total": total})
}

// GET /member/reports/:id
func (ctl *MemberReportController) GetByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	rep, err := ctl.Service.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	memberID, err := utils.GetUserID(c)
	if err != nil { // Should technically be unauthorized but we continue logically
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}
	if rep.ReporterID != memberID {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}
	c.JSON(http.StatusOK, rep)
}

// PUT /member/reports/:id
func (ctl *MemberReportController) Update(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var req createReportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	memberID, err := utils.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	in := &services.CreateReportInput{
		TargetType:  req.TargetType,
		TargetID:    req.TargetID,
		Title:       req.Title,
		Description: req.Description,
		Medias:      req.Medias,
	}
	rep, err := ctl.Service.UpdateReport(id, memberID, in)
	if err != nil {
		// Can distinguish error types here
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, rep)
}

// DELETE /member/reports/:id
func (ctl *MemberReportController) Delete(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	memberID, err := utils.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	err = ctl.Service.DeleteReport(id, memberID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

// POST /member/posts/:id/report
// Report a specific post (cannot report own posts)
func (ctl *MemberReportController) ReportPost(c *gin.Context) {
	postIDStr := c.Param("id")
	postID64, err := strconv.ParseUint(postIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid post id"})
		return
	}
	postID := uint(postID64)

	var req struct {
		Title       string                      `json:"title" binding:"required"`
		Description string                      `json:"description" binding:"required"`
		Medias      []services.ReportMediaInput `json:"medias"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	memberID, err := utils.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	report, err := ctl.Service.ReportPost(postID, memberID, req.Title, req.Description, req.Medias)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, report)
}
