package controller

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/internal/app/services"
)

type AdminReportController struct {
	Service *services.ReportService
}

func NewAdminReportController(s *services.ReportService) *AdminReportController {
	return &AdminReportController{Service: s}
}

type updateReportStatusRequest struct {
	StatusID int `json:"status_id" form:"status_id"`
}

// GET /admin/reports
func (ctl *AdminReportController) List(c *gin.Context) {
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
	var reporterID *uint
	if r := c.Query("reporter_id"); r != "" {
		if n, err := strconv.Atoi(r); err == nil {
			v := uint(n)
			reporterID = &v
		}
	}
	q := c.Query("q")

	items, total, err := ctl.Service.AdminListReports(page, pageSize, statusID, targetType, reporterID, q)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": items, "total": total})
}

// GET /admin/reports/:id
func (ctl *AdminReportController) GetByID(c *gin.Context) {
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
	c.JSON(http.StatusOK, rep)
}

// POST /admin/reports/:id/status
func (ctl *AdminReportController) UpdateStatus(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var req updateReportStatusRequest
	// Accept JSON or form; fall back to query string
	if err := c.ShouldBind(&req); err != nil {
		// continue to fallback parsing
	}
	if req.StatusID == 0 {
		if s := c.Query("status_id"); s != "" {
			if n, err := strconv.Atoi(s); err == nil {
				req.StatusID = n
			}
		}
	}
	if req.StatusID == 0 {
		if s := c.PostForm("status_id"); s != "" {
			if n, err := strconv.Atoi(s); err == nil {
				req.StatusID = n
			}
		}
	}
	if req.StatusID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "status_id is required"})
		return
	}

	val, ok := c.Get("admin_id")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing admin id"})
		return
	}
	var adminID uint
	switch v := val.(type) {
	case uint:
		adminID = v
	case int:
		adminID = uint(v)
	case float64:
		adminID = uint(v)
	case string:
		if n, err := strconv.Atoi(v); err == nil {
			adminID = uint(n)
		}
	}
	if adminID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid admin id"})
		return
	}

	if err := ctl.Service.UpdateStatus(id, req.StatusID, adminID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}
