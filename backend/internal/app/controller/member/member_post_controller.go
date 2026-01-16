package controller

import (
	"mime/multipart"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/app/services"
	"github.com/sut68/team12/backend/internal/dto"
	"github.com/sut68/team12/backend/internal/entity"
)

type PostController struct {
	Service                 *services.PostService
	PointTransactionService services.PointTransactionService
	PointRuleRepo           repository.PointRuleRepository
	PostStarRepo            repository.PostStarRepository
	MemberService           services.MemberService // ✅ Add MemberService
	PointService            services.PointService  // ✅ Add PointService for EarnPoints
}

func NewPostController(
	s *services.PostService,
	ptService services.PointTransactionService,
	prRepo repository.PointRuleRepository,
	psRepo repository.PostStarRepository,
	mService services.MemberService, // ✅ Add param
	pService services.PointService, // ✅ Add PointService
) *PostController {
	return &PostController{
		Service:                 s,
		PointTransactionService: ptService,
		PointRuleRepo:           prRepo,
		PostStarRepo:            psRepo,
		MemberService:           mService, // ✅ Init
		PointService:            pService, // ✅ Init
	}
}

// Helper to get Profile ID (MemberID) from AccountID (user_id in JWT)
func (ctl *PostController) getMemberProfileID(c *gin.Context) (uint, bool) {
	accountID := c.GetUint("user_id")
	if accountID == 0 {
		return 0, false
	}
	// Call MemberService to get profile
	m, err := ctl.MemberService.GetProfileByAccountID(accountID)
	if err != nil {
		// ✅ เพิ่ม log เพื่อ debug
		c.Error(err) // GIN จะ log error ออกมา
		return 0, false
	}
	return m.ID, true
}

// ---- Create Post ----
// Post /posts (supports both JSON and multipart/form-data)
func (ctl *PostController) CreatePost(c *gin.Context) {
	var req dto.CreatePostRequest
	var imageFiles []*multipart.FileHeader
	var attachmentFiles []*multipart.FileHeader

	contentType := c.ContentType()
	isMultipart := contentType == "multipart/form-data" || (len(contentType) > 19 && contentType[:19] == "multipart/form-data")

	if isMultipart {
		// Manual parsing for multipart/form-data
		req.Title = c.PostForm("title")
		req.Content = c.PostForm("content")
		req.IsAnonymous = c.PostForm("is_anonymous") == "true"

		// Parse category IDs
		if mainCatStr := c.PostForm("main_category_id"); mainCatStr != "" {
			if v, err := strconv.ParseUint(mainCatStr, 10, 32); err == nil {
				catID := uint(v)
				req.MainCategoryID = &catID
			}
		}
		if sub1Str := c.PostForm("sub_category1_id"); sub1Str != "" {
			if v, err := strconv.ParseUint(sub1Str, 10, 32); err == nil {
				catID := uint(v)
				req.SubCategory1ID = &catID
			}
		}
		if sub2Str := c.PostForm("sub_category2_id"); sub2Str != "" {
			if v, err := strconv.ParseUint(sub2Str, 10, 32); err == nil {
				catID := uint(v)
				req.SubCategory2ID = &catID
			}
		}

		// Get files
		form, err := c.MultipartForm()
		if err == nil && form != nil {
			if files, ok := form.File["images"]; ok {
				imageFiles = files
			}
			if files, ok := form.File["attachments"]; ok {
				attachmentFiles = files
			}
		}

		// Validate required fields
		if len(req.Title) < 3 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "title must be at least 3 characters"})
			return
		}
		if len(req.Content) < 5 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "content must be at least 5 characters"})
			return
		}
	} else {
		// JSON binding
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
	}

	// ✅ Fix: Get Profile ID (MemberID) instead of AccountID
	memberID, ok := ctl.getMemberProfileID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized (profile not found)"})
		return
	}

	post, err := ctl.Service.CreatePost(memberID, req, imageFiles, attachmentFiles)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "created",
		"data":    post,
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

// ---- Get All Posts ----
// GET /posts?page=1&limit=20
func (ctl *PostController) GetAllPosts(c *gin.Context) {
	// Parse pagination params
	pageStr := c.DefaultQuery("page", "0")
	limitStr := c.DefaultQuery("limit", "0")

	page, _ := strconv.Atoi(pageStr)
	limit, _ := strconv.Atoi(limitStr)

	// If no pagination params, return all (for backward compatibility)
	if page == 0 && limit == 0 {
		posts, err := ctl.Service.GetAllPosts()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"data": posts})
		return
	}

	// With pagination
	posts, total, err := ctl.Service.GetPostsPaginated(page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	hasMore := int64(page*limit) < total

	c.JSON(http.StatusOK, gin.H{
		"data":    posts,
		"total":   total,
		"page":    page,
		"limit":   limit,
		"hasMore": hasMore,
	})
}

// ---- Update Post ----
// PUT /posts/:id (supports both JSON and multipart/form-data)
func (ctl *PostController) UpdatePost(c *gin.Context) {
	postID, err := parseUintParam(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid post id"})
		return
	}

	memberID, ok := ctl.getMemberProfileID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req dto.UpdatePostRequest
	var imageFiles []*multipart.FileHeader
	var attachmentFiles []*multipart.FileHeader
	var deletedImageIDs []uint
	var deletedAttachmentIDs []uint

	contentType := c.ContentType()
	isMultipart := contentType == "multipart/form-data" || (len(contentType) > 19 && contentType[:19] == "multipart/form-data")

	if isMultipart {
		// Manual parsing for multipart/form-data
		if title := c.PostForm("title"); title != "" {
			req.Title = &title
		}
		if content := c.PostForm("content"); content != "" {
			req.Content = &content
		}
		anonymous := c.PostForm("is_anonymous") == "true"
		req.IsAnonymous = &anonymous

		// Parse deleted file IDs
		for _, idStr := range c.PostFormArray("deleted_image_ids") {
			if v, err := strconv.ParseUint(idStr, 10, 32); err == nil {
				deletedImageIDs = append(deletedImageIDs, uint(v))
			}
		}
		for _, idStr := range c.PostFormArray("deleted_attachment_ids") {
			if v, err := strconv.ParseUint(idStr, 10, 32); err == nil {
				deletedAttachmentIDs = append(deletedAttachmentIDs, uint(v))
			}
		}

		// Get files
		form, err := c.MultipartForm()
		if err == nil && form != nil {
			if files, ok := form.File["images"]; ok {
				imageFiles = files
			}
			if files, ok := form.File["attachments"]; ok {
				attachmentFiles = files
			}
		}
	} else {
		// JSON binding
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
	}

	post, err := ctl.Service.UpdatePost(memberID, postID, req, imageFiles, attachmentFiles, deletedImageIDs, deletedAttachmentIDs)
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

	memberID, ok := ctl.getMemberProfileID(c)
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

// =============== LIKE HANDLERS ===============

// GetLikeStatus - GET /api/member/posts/:id/like/status
func (ctl *PostController) GetLikeStatus(c *gin.Context) {
	postID, err := parseUintParam(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid post id"})
		return
	}

	memberID, ok := ctl.getMemberProfileID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	isLiked := ctl.Service.HasUserLiked(postID, memberID)
	isBookmarked := ctl.Service.IsBookmarked(postID, memberID)

	// Check if starred (PointRule "StarPost")
	isStarred := false
	starred, err := ctl.PostStarRepo.HasStarred(memberID, postID)
	if err == nil {
		isStarred = starred
	}

	c.JSON(http.StatusOK, gin.H{
		"is_liked":      isLiked,
		"is_bookmarked": isBookmarked,
		"is_starred":    isStarred,
	})
}

// ToggleLike - POST /api/member/posts/:id/like
func (ctl *PostController) ToggleLike(c *gin.Context) {
	postID, err := parseUintParam(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid post id"})
		return
	}

	memberID, ok := ctl.getMemberProfileID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	likeCount, isLiked, err := ctl.Service.ToggleLike(postID, memberID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"like_count": likeCount,
		"is_liked":   isLiked,
	})
}

// ToggleBookmark - POST /api/member/posts/:id/bookmark
func (ctl *PostController) ToggleBookmark(c *gin.Context) {
	postID, err := parseUintParam(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid post id"})
		return
	}

	memberID, ok := ctl.getMemberProfileID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	isBookmarked, err := ctl.Service.ToggleBookmark(postID, memberID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"is_bookmarked": isBookmarked,
	})
}

// SendStar - POST /api/member/posts/:id/star
func (ctl *PostController) SendStar(c *gin.Context) {
	postID, err := parseUintParam(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid post id"})
		return
	}

	memberID, ok := ctl.getMemberProfileID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	// 1. Get Post to find author
	post, err := ctl.Service.GetPostByID(postID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "post not found"})
		return
	}

	// Prevent giving star to own post? (Optional, but good practice)
	if post.AuthorID == memberID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "cannot star your own post"})
		return
	}

	// 2. Check if already starred
	// (PointRule fetching moved to inside EarnPoints)

	hasStarred, err := ctl.PostStarRepo.HasStarred(memberID, postID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if hasStarred {
		c.JSON(http.StatusBadRequest, gin.H{"error": "already starred this post"})
		return
	}

	// 3. Create PostStar record
	star := &entity.PostStar{
		MemberID: memberID,
		PostID:   post.ID,
	}
	if err := ctl.PostStarRepo.Create(star); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 4. ⭐ POINT SYSTEM: Give points to Author (Post Quality)
	if ctl.PointService != nil {
		// Idempotency: "Post Quality:<PostID>:<SenderID>"
		// Ensures points are awarded unique per [Post + Sender] pair
		idemKey := "Post Quality:" + strconv.FormatUint(uint64(post.ID), 10) + ":" + strconv.FormatUint(uint64(memberID), 10)

		// Author receives points
		// Source: "POST_STAR", SourceID: star.ID
		err := ctl.PointService.EarnPoints(
			post.AuthorID,
			"Post Quality", // Renamed from StarPost
			"POST_STAR",
			star.ID,
			idemKey,
		)

		if err != nil {
			// Log error via console/logger used in project?
			// For now, if daily limit reached or dup, we just ignore client warning
			// or could return specific message.
			// But usually we treat star as success even if points failed/maxed out.
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "star sent",
		"is_starred": true,
	})
}

// =============== COMMENT HANDLERS ===============

// GetComments - GET /api/member/posts/:id/comments
func (ctl *PostController) GetComments(c *gin.Context) {
	postID, err := parseUintParam(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid post id"})
		return
	}

	comments, err := ctl.Service.GetComments(postID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get current user's member ID for checking liked status
	memberID, ok := ctl.getMemberProfileID(c)

	// Create response with is_liked field
	type CommentResponse struct {
		entity.Comment
		IsLiked bool `json:"is_liked"`
	}

	var response []CommentResponse
	for _, comment := range comments {
		isLiked := false
		if ok && memberID > 0 {
			// Check if user liked this comment
			isLiked = ctl.Service.HasUserLikedComment(comment.ID, memberID)
		}
		response = append(response, CommentResponse{
			Comment: comment,
			IsLiked: isLiked,
		})
	}

	c.JSON(http.StatusOK, gin.H{"data": response})
}

// CreateComment - POST /api/member/posts/:id/comments
// Supports both JSON and multipart/form-data
func (ctl *PostController) CreateComment(c *gin.Context) {
	postID, err := parseUintParam(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid post id"})
		return
	}

	memberID, ok := ctl.getMemberProfileID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var content string
	var isAnonymous bool
	var imageFiles []*multipart.FileHeader
	var attachmentFiles []*multipart.FileHeader

	contentType := c.ContentType()
	isMultipart := contentType == "multipart/form-data" || (len(contentType) > 19 && contentType[:19] == "multipart/form-data")

	if isMultipart {
		// Manual parsing for multipart/form-data
		content = c.PostForm("content")
		isAnonymous = c.PostForm("is_anonymous") == "true"

		// Validate content
		if len(content) < 1 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "content is required"})
			return
		}

		// Get files
		form, err := c.MultipartForm()
		if err == nil && form != nil {
			if files, ok := form.File["images"]; ok {
				imageFiles = files
			}
			if files, ok := form.File["attachments"]; ok {
				attachmentFiles = files
			}
		}
	} else {
		// JSON binding
		var req struct {
			Content     string `json:"content" binding:"required,min=1"`
			IsAnonymous bool   `json:"is_anonymous"`
		}

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		content = req.Content
		isAnonymous = req.IsAnonymous
	}

	comment, err := ctl.Service.CreateComment(postID, memberID, content, isAnonymous, imageFiles, attachmentFiles)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "comment created",
		"data":    comment,
	})
}

// DeleteComment - DELETE /api/member/posts/:id/comments/:commentId
func (ctl *PostController) DeleteComment(c *gin.Context) {
	commentID, err := parseUintParam(c, "commentId")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid comment id"})
		return
	}

	memberID, ok := ctl.getMemberProfileID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	if err := ctl.Service.DeleteComment(commentID, memberID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "comment deleted"})
}

// GetBookmarkedPosts - GET /api/member/posts/bookmarked
func (ctl *PostController) GetBookmarkedPosts(c *gin.Context) {
	memberID, ok := ctl.getMemberProfileID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	posts, err := ctl.Service.GetBookmarkedPosts(memberID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": posts})
}

// GetMyPosts - GET /api/member/posts/mine
func (ctl *PostController) GetMyPosts(c *gin.Context) {
	// ✅ Fixed: Use getMemberProfileID to get correct Member Profile ID (not Account ID)
	memberID, ok := ctl.getMemberProfileID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized (profile not found)"})
		return
	}

	posts, err := ctl.Service.GetMyPosts(memberID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": posts})
}

// GetPostsByUser - GET /api/member/posts/user/:userID
func (ctl *PostController) GetPostsByUser(c *gin.Context) {
	userIDStr := c.Param("userID")
	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	posts, err := ctl.Service.GetPostsByMemberID(uint(userID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": posts})
}

// GetFavsByUser - GET /api/member/posts/user/:userID/fav
func (ctl *PostController) GetFavsByUser(c *gin.Context) {
	userIDStr := c.Param("userID")
	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	posts, err := ctl.Service.GetBookmarkedPostsByMemberID(uint(userID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": posts})
}

// ToggleLikeComment - POST /api/member/posts/:id/comments/:commentId/like
func (ctl *PostController) ToggleLikeComment(c *gin.Context) {
	memberID, ok := ctl.getMemberProfileID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	commentIdStr := c.Param("commentId")
	commentID, err := strconv.ParseUint(commentIdStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid comment id"})
		return
	}

	isLiked, likeCount, err := ctl.Service.ToggleLikeComment(uint(commentID), memberID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"is_liked":   isLiked,
		"like_count": likeCount,
	})
}
