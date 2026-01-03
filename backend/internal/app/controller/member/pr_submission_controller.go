package controller

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/internal/app/services"
)

type PRSubmissionController struct {
	Service *services.PRSubmissionService
}

func NewPRSubmissionController(s *services.PRSubmissionService) *PRSubmissionController {
	return &PRSubmissionController{Service: s}
}

type createPRRequest struct {
	Title      string                   `json:"title" binding:"required"`
	Content    string                   `json:"content" binding:"required"`
	ReqStartAt *string                  `json:"req_start_at"`
	ReqEndAt   *string                  `json:"req_end_at"`
	Medias     []map[string]interface{} `json:"medias"`
}

// POST /member/pr-submissions
func (ctl *PRSubmissionController) Create(c *gin.Context) {
	var req createPRRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	val, ok := c.Get("user_id")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing user id"})
		return
	}
	// parse memberID to uint
	var uid uint
	switch v := val.(type) {
	case string:
		id64, err := strconv.ParseUint(v, 10, 32)
		if err == nil {
			uid = uint(id64)
		}
	case int:
		uid = uint(v)
	case float64:
		uid = uint(v)
	case uint:
		uid = v
	}
	if uid == 0 {
		// fallback try to parse if valid is string but failed?
		// if still 0, unexpected
	}

	// map input to service input
	svcReq := &services.CreatePRSubmissionInput{
		Title:   req.Title,
		Content: req.Content,
	}
	// parse optional times
	if req.ReqStartAt != nil {
		if t, err := timeParsePtr(*req.ReqStartAt); err == nil {
			svcReq.ReqStartAt = t
		}
	}
	if req.ReqEndAt != nil {
		if t, err := timeParsePtr(*req.ReqEndAt); err == nil {
			svcReq.ReqEndAt = t
		}
	}
	for _, m := range req.Medias {
		url, _ := m["url"].(string)
		typ, _ := m["type"].(string)
		isCover := false
		if ic, ok := m["is_cover"].(bool); ok {
			isCover = ic
		}
		svcReq.Medias = append(svcReq.Medias, services.PRMediaInput{URL: url, Type: typ, IsCover: isCover})
	}

	sub, err := ctl.Service.CreateSubmission(uid, svcReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, sub)
}

// GET /member/pr-submissions
func (ctl *PRSubmissionController) List(c *gin.Context) {
	val, ok := c.Get("user_id")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing user id"})
		return
	}
	var uid uint
	switch v := val.(type) {
	case string:
		id64, _ := strconv.ParseUint(v, 10, 32)
		uid = uint(id64)
	case int:
		uid = uint(v)
	case float64:
		uid = uint(v)
	case uint:
		uid = v
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
	q := c.Query("q")

	items, total, err := ctl.Service.ListMemberSubmissions(uid, page, pageSize, statusID, q)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": items, "total": total})
}

// GET /member/pr-submissions/:id
func (ctl *PRSubmissionController) GetByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	sub, err := ctl.Service.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	val, _ := c.Get("user_id")
	var uid uint
	switch v := val.(type) {
	case string:
		id64, _ := strconv.ParseUint(v, 10, 32)
		uid = uint(id64)
	case int:
		uid = uint(v)
	case float64:
		uid = uint(v)
	case uint:
		uid = v
	}
	if sub.MemberID != uid {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}
	c.JSON(http.StatusOK, sub)
}

// helper to parse time string pointer
func timeParsePtr(s string) (*time.Time, error) {
	if s == "" {
		return nil, nil
	}
	t, err := time.Parse(time.RFC3339, s)
	if err != nil {
		return nil, err
	}
	return &t, nil
}
