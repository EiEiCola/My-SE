package controller

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/internal/app/services"
)

type AdminPostController struct {
	Service *services.PostService
}

func NewAdminPostController(s *services.PostService) *AdminPostController {
	return &AdminPostController{Service: s}
}

// ---- Get All Posts (Admin) ----
// GET /api/admin/posts
func (ctl *AdminPostController) GetAllPosts(c *gin.Context) {
	posts, err := ctl.Service.GetAllPosts()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": posts})
}

// ---- Admin Delete Post ----
// DELETE /api/admin/posts/:id
func (ctl *AdminPostController) DeletePost(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid post id"})
		return
	}

	// Admin สามารถลบโพสต์ใครก็ได้ โดยไม่ต้องเช็ค ownership
	if err := ctl.Service.AdminDeletePost(uint(id)); err != nil {
		if err == services.ErrPostNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "post not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}
