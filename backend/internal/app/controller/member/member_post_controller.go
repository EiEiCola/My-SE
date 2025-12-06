package controller

import (
	"mime/multipart"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/internal/app/services"
	"github.com/sut68/team12/backend/internal/dto"
)

type PostController struct {
	Service *services.PostService
}

func NewPostController(s *services.PostService) *PostController {
	return &PostController{Service: s}
}

// ---- Create Post ----
// Post /posts (multipart/form-data)
func (ctl *PostController) CreatePost(c *gin.Context) {
	var req dto.CreatePostRequest

	// ใช้ ShouldBind เพื่อรองรับ form-data ด้วย
	if err := c.ShouldBind(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	memberID, ok := getMemberID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	// รับไฟล์จาก multipart form
	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid multipart form"})
		return
	}

	var imageFiles []*multipart.FileHeader
	var attachmentFiles []*multipart.FileHeader

	if form != nil {
		if files, ok := form.File["images"]; ok {
			imageFiles = files
		}
		if files, ok := form.File["attachments"]; ok {
			attachmentFiles = files
		}
	}

	post, err := ctl.Service.CreatePost(memberID, req, imageFiles, attachmentFiles)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "created",
		"data":   post,
	})
}

// ---- Get by ID ----
// GET /posts/:id
func (ctl *PostController) GetPostByID(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid post id"})
		return
	}

	post, err := ctl.Service.GetPostByID(id)
	if err != nil {
		if err == services.ErrPostNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "post not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": post})
}

// ---- Update Post ----
// PUT /posts/:id (JSON body)
func (ctl *PostController) UpdatePost(c *gin.Context) {
	postID, err := parseUintParam(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid post id"})
		return
	}

	memberID, ok := getMemberID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req dto.UpdatePostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	post, err := ctl.Service.UpdatePost(memberID, postID, req)
	if err != nil {
		switch err {
		case services.ErrPostNotFound:
			c.JSON(http.StatusNotFound, gin.H{"error": "post not found"})
		case services.ErrForbidden:
			c.JSON(http.StatusForbidden, gin.H{"error": "you can update only your own post"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": post})
}

// ---- Delete Post ----
// DELETE /posts/:id
func (ctl *PostController) DeletePost(c *gin.Context) {
	postID, err := parseUintParam(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid post id"})
		return
	}	

	memberID, ok := getMemberID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	if err := ctl.Service.DeletePost(memberID, postID); err != nil {
		switch err {
		case services.ErrPostNotFound:
			c.JSON(http.StatusNotFound, gin.H{"error": "post not found"})
		case services.ErrForbidden:
			c.JSON(http.StatusForbidden, gin.H{"error": "you can delete only your own post"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}