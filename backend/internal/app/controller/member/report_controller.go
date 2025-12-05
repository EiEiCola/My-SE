package controller

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/internal/app/services"
)

type MemberReportController struct {
	Service *services.ReportService
}

func NewMemberReportController(s *services.ReportService) *MemberReportController {
	return &MemberReportController{Service: s}
}

type createReportRequest struct {
	TargetType  string                      `json:"target_type" binding:"required"`
	TargetID    *int                        `json:"target_id"`
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
	val, ok := c.Get("member_id")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing member id"})
		return
	}
	var memberID uint
	switch v := val.(type) {
	case int:
		memberID = uint(v)
	case string:
		if n, err := strconv.Atoi(v); err == nil {
			memberID = uint(n)
		}
	}
	if memberID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid member id"})
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
	val, ok := c.Get("member_id")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing member id"})
		return
	}
	var memberID uint
	switch v := val.(type) {
	case int:
		memberID = uint(v)
	case string:
		if n, err := strconv.Atoi(v); err == nil {
			memberID = uint(n)
		}
	}
	if memberID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid member id"})
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
	val, _ := c.Get("member_id")
	var memberID uint
	switch v := val.(type) {
	case int:
		memberID = uint(v)
	case string:
		if n, err := strconv.Atoi(v); err == nil {
			memberID = uint(n)
		}
	}
	if rep.ReporterID != memberID {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}
	c.JSON(http.StatusOK, rep)
}
