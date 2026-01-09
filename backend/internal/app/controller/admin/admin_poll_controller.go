package controller

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/internal/app/services"
	"github.com/sut68/team12/backend/internal/dto"
)

type AdminPollController struct {
	pollService services.PollService
}

func NewAdminPollController(pollService services.PollService) *AdminPollController {
	return &AdminPollController{pollService: pollService}
}

func (ctl *AdminPollController) List(c *gin.Context) {
	// optional: ?status_id=2
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

	res, err := ctl.pollService.ListForAdmin(statusID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// ✅ กัน nil slice ไม่ให้ JSON ออกเป็น null
	if res == nil {
		res = []dto.PollResponse{}
	}

	c.JSON(http.StatusOK, res)
}
func (ctl *AdminPollController) Approve(c *gin.Context) {
	pollID64, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid poll id"})
		return
	}
	pollID := uint(pollID64)

	adminAny, ok := c.Get("admin_id")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "admin_id not found"})
		return
	}

	var adminID uint
	switch v := adminAny.(type) {
	case uint:
		adminID = v
	case int:
		adminID = uint(v)
	default:
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid admin_id type"})
		return
	}

	res, err := ctl.pollService.Approve(adminID, pollID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, res)
}

func (ctl *AdminPollController) Reject(c *gin.Context) {
	pollID64, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid poll id"})
		return
	}
	pollID := uint(pollID64)

	var req dto.RejectPollRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body", "detail": err.Error()})
		return
	}

	adminAny, ok := c.Get("admin_id")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "admin_id not found"})
		return
	}

	var adminID uint
	switch v := adminAny.(type) {
	case uint:
		adminID = v
	case int:
		adminID = uint(v)
	default:
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid admin_id type"})
		return
	}

	res, err := ctl.pollService.Reject(adminID, pollID, req.Reason)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, res)
}

func (ctl *AdminPollController) Close(c *gin.Context) {
	pollID64, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid poll id"})
		return
	}
	pollID := uint(pollID64)

	// ✅ Parse reason from request body
	var req dto.ClosePollRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "reason is required", "detail": err.Error()})
		return
	}

	adminAny, ok := c.Get("admin_id")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "admin_id not found"})
		return
	}

	var adminID uint
	switch v := adminAny.(type) {
	case uint:
		adminID = v
	case int:
		adminID = uint(v)
	default:
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid admin_id type"})
		return
	}

	res, err := ctl.pollService.Close(adminID, pollID, req.Reason)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, res)
}

// ✅ NEW: GET /api/admin/polls/:id
// =========================
func (ctl *AdminPollController) GetByID(c *gin.Context) {
	pollID64, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid poll id"})
		return
	}
	pollID := uint(pollID64)

	// (optional) ถ้าจะบังคับว่าเป็น admin จริง ๆ ก็เช็ค admin_id เหมือนตัวอื่นได้
	// แต่ใน routes ของหนูมี middleware แล้ว เลยไม่จำเป็นก็ได้
	_, ok := c.Get("admin_id")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "admin_id not found"})
		return
	}

	res, err := ctl.pollService.GetByIDForAdmin(pollID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, res)
}

// =========================
// ✅ DELETE /api/admin/polls/:id (with reason)
// =========================
func (ctl *AdminPollController) Delete(c *gin.Context) {
	pollID64, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid poll id"})
		return
	}
	pollID := uint(pollID64)

	// ✅ Parse reason from request body
	var req dto.DeletePollRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "reason is required", "detail": err.Error()})
		return
	}

	adminAny, ok := c.Get("admin_id")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "admin_id not found"})
		return
	}

	var adminID uint
	switch v := adminAny.(type) {
	case uint:
		adminID = v
	case int:
		adminID = uint(v)
	default:
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid admin_id type"})
		return
	}

	res, err := ctl.pollService.DeleteForAdmin(adminID, pollID, req.Reason)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, res)
}
