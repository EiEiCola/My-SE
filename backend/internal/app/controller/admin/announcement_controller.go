package controller

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/internal/app/services"
)

type AdminAnnouncementController struct {
	Service *services.AnnouncementService
}

func NewAdminAnnouncementController(s *services.AnnouncementService) *AdminAnnouncementController {
	return &AdminAnnouncementController{Service: s}
}

// GET /admin/announcements
func (ctl *AdminAnnouncementController) List(c *gin.Context) {
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

	// Optional filter by PR Submission ID (for quick lookup from request page)
	var prID *int
	if p := c.Query("pr_id"); p != "" {
		if n, err := strconv.Atoi(p); err == nil {
			prID = &n
		}
	}

	// Admin should see ALL announcements (with optional pr_id filter)
	items, total, err := ctl.Service.ListAll(page, pageSize, prID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": items, "total": total})
}

// GET /admin/announcements/:id
func (ctl *AdminAnnouncementController) GetByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	ann, err := ctl.Service.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, ann)
}

// POST /admin/announcements
func (ctl *AdminAnnouncementController) Create(c *gin.Context) {
	var req services.CreateAnnouncementInput
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	// Extra validation: title/content must be non-empty after trim
	if strings.TrimSpace(req.Title) == "" || strings.TrimSpace(req.Content) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "title and content are required"})
		return
	}
	val, ok := c.Get("admin_id")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing admin id"})
		return
	}
	var adminID int
	switch v := val.(type) {
	case int:
		adminID = v
	case string:
		if n, err := strconv.Atoi(v); err == nil {
			adminID = n
		}
	}

	ann, err := ctl.Service.CreateAnnouncement(adminID, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, ann)
}

// PUT /admin/announcements/:id
func (ctl *AdminAnnouncementController) Update(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var req services.CreateAnnouncementInput
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	// Extra validation: title/content must be non-empty after trim
	if strings.TrimSpace(req.Title) == "" || strings.TrimSpace(req.Content) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "title and content are required"})
		return
	}
	ann, err := ctl.Service.UpdateAnnouncement(id, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, ann)
}

// DELETE /admin/announcements/:id
func (ctl *AdminAnnouncementController) Delete(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	if err := ctl.Service.DeleteAnnouncement(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}
