package controller

import (
	"net/http"
	"strconv"
	"time"

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

	var start *time.Time
	var end *time.Time
	if s := c.Query("start_at"); s != "" {
		if t, err := time.Parse(time.RFC3339, s); err == nil {
			start = &t
		}
	}
	if e := c.Query("end_at"); e != "" {
		if t, err := time.Parse(time.RFC3339, e); err == nil {
			end = &t
		}
	}

	now := time.Now()
	items, total, err := ctl.Service.ListAnnouncements(page, pageSize, now, start, end)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": items, "total": total})
}
