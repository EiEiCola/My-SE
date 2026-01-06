package controller

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/internal/app/services"
	"github.com/sut68/team12/backend/internal/utils"
)

type MemberAnnouncementController struct {
	Service *services.AnnouncementService
}

func NewMemberAnnouncementController(s *services.AnnouncementService) *MemberAnnouncementController {
	return &MemberAnnouncementController{Service: s}
}

// GET /member/announcements/:id
func (ctl *MemberAnnouncementController) GetByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	ann, err := ctl.Service.GetPublishedByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "announcement not found or not available"})
		return
	}
	c.JSON(http.StatusOK, ann)
}

// GET /member/announcements
func (ctl *MemberAnnouncementController) List(c *gin.Context) {
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

	now := time.Now()
	// Pass now as published window check
	items, total, err := ctl.Service.ListAnnouncements(page, pageSize, now, nil, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": items, "total": total})
}

// GET /member/announcements/unread
func (ctl *MemberAnnouncementController) GetUnread(c *gin.Context) {
	uid, err := utils.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	items, err := ctl.Service.GetUnreadAnnouncements(uid, 50) // Limit 50
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, items)
}

// POST /member/announcements/:id/read
func (ctl *MemberAnnouncementController) MarkRead(c *gin.Context) {
	uid, err := utils.GetUserID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	if err := ctl.Service.MarkAsRead(uid, id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "marked as read"})
}
