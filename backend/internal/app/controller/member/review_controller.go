package controller

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/internal/app/services"
	"github.com/sut68/team12/backend/internal/dto"
	"gorm.io/gorm"
)

type ReviewController struct {
	reviewService services.ReviewService
	memberService services.MemberService // ✅ Add MemberService
}

func NewReviewController(reviewService services.ReviewService, memberService services.MemberService) *ReviewController {
	return &ReviewController{
		reviewService: reviewService,
		memberService: memberService,
	}
}

// Helper: resolve MemberID from AccountID (from context)
func (rc *ReviewController) getActualMemberID(c *gin.Context) (uint, error) {
	// Try getting member_id directly first
	v, ok := c.Get("member_id")
	if !ok {
		// Try accessing user_id which is typically AccountID
		v, ok = c.Get("user_id")
		if !ok {
			return 0, errors.New("missing user_id")
		}
	}

	// Convert to uint
	var accountID uint
	switch t := v.(type) {
	case uint:
		accountID = t
	case int:
		if t < 0 { return 0, errors.New("invalid id") }
		accountID = uint(t)
	case float64:
		if t < 0 { return 0, errors.New("invalid id") }
		accountID = uint(t)
	default:
		return 0, errors.New("invalid id type")
	}

	// Resolve Profile ID
	m, err := rc.memberService.GetProfileByAccountID(accountID)
	if err != nil {
		return 0, err
	}
	return m.ID, nil
}

// POST /api/member/reviews
func (rc *ReviewController) CreateReview(c *gin.Context) {
	var req dto.CreateReviewRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":  "invalid request body",
			"detail": err.Error(),
		})
		return
	}

	// member_id จาก middleware
	// member_id จาก middleware (แก้ไขให้ lookup member จริง)
	memberID, err := rc.getActualMemberID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized", "detail": err.Error()})
		return
	}
	req.MemberID = memberID

	review, err := rc.reviewService.CreateReview(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":  "failed to create review",
			"detail": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "review created successfully",
		"data":    review,
	})
}

// GET /api/member/reviews?main_category_id=1
func (rc *ReviewController) ListReviews(c *gin.Context) {
	var mainCatID *uint

	if v := c.Query("main_category_id"); v != "" {
		parsed, err := strconv.ParseUint(v, 10, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "main_category_id invalid"})
			return
		}
		id := uint(parsed)
		mainCatID = &id
	}

	reviews, err := rc.reviewService.ListReviews(mainCatID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":  "failed to list reviews",
			"detail": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": reviews})
}

// DELETE /api/member/reviews/:id
func (rc *ReviewController) DeleteReview(c *gin.Context) {
	memberID, err := rc.getActualMemberID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized", "detail": err.Error()})
		return
	}

	id64, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	reviewID := uint(id64)

	if err := rc.reviewService.DeleteReview(reviewID, memberID); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusForbidden, gin.H{"error": "not found or not owner"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete review", "detail": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "review deleted"})
}

// ✅ POST /api/member/reviews/:id/images (multipart/form-data)
// form key: images (multiple)
func (rc *ReviewController) UploadReviewImages(c *gin.Context) {
	// member_id จาก middleware
	memberID, err := rc.getActualMemberID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized", "detail": err.Error()})
		return
	}

	// review id
	id64, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid review id"})
		return
	}
	reviewID := uint(id64)

	// get files
	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid multipart form", "detail": err.Error()})
		return
	}
	files := form.File["images"]
	if len(files) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no images uploaded (key must be 'images')"})
		return
	}

	// prepare folder
	saveDir := filepath.Join("uploads", "reviews")
	if err := os.MkdirAll(saveDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot create upload dir", "detail": err.Error()})
		return
	}

	// save each file, build images[] for DB
	images := make([]dto.ReviewImageRequest, 0, len(files))

	for i, f := range files {
		ext := strings.ToLower(filepath.Ext(f.Filename))
		if ext == "" {
			ext = ".jpg"
		}
		// กัน ext แปลก ๆ (ทำแบบง่าย)
		if ext != ".jpg" && ext != ".jpeg" && ext != ".png" && ext != ".webp" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "unsupported file type", "filename": f.Filename})
			return
		}

		// random name
		rb := make([]byte, 8)
		_, _ = rand.Read(rb)
		name := hex.EncodeToString(rb) + "_" + strconv.FormatInt(time.Now().UnixNano(), 10) + ext

		dst := filepath.Join(saveDir, name)
		if err := c.SaveUploadedFile(f, dst); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "save file failed", "detail": err.Error()})
			return
		}

		publicURL := "/uploads/reviews/" + name

		images = append(images, dto.ReviewImageRequest{
			URL:       publicURL,
			IsCover:   i == 0, // ให้รูปแรกเป็น cover ไปก่อน
			SortOrder: i + 1,
		})
	}

	// insert to DB
	if err := rc.reviewService.AddReviewImages(reviewID, memberID, images); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusForbidden, gin.H{"error": "not found or not owner"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save images", "detail": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "images uploaded",
		"data":    images,
	})
}

// ✅ POST /api/member/reviews/:id/vote
func (rc *ReviewController) VoteReview(c *gin.Context) {
	// member_id จาก middleware (mockMemberAuth)
	// member_id จาก middleware
	memberID, err := rc.getActualMemberID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized", "detail": err.Error()})
		return
	}

	// review id
	id64, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid review id"})
		return
	}
	reviewID := uint(id64)

	var req dto.VoteReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body", "detail": err.Error()})
		return
	}

	resp, err := rc.reviewService.VoteReview(reviewID, memberID, req.VoteType)
	if err != nil {
		if err.Error() == "owner_cannot_vote" {
			c.JSON(http.StatusForbidden, gin.H{"error": "owner_cannot_vote"})
			return
		}
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "review_not_found"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": "vote failed", "detail": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "vote updated",
		"data":    resp,
	})
}

// GET /api/member/reviews/my?main_category_id=1
func (rc *ReviewController) ListMyReviews(c *gin.Context) {
	// member_id จาก middleware
	// member_id จาก middleware
	memberID, err := rc.getActualMemberID(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized", "detail": err.Error()})
		return
	}

	// optional category filter
	var mainCatID *uint
	if q := c.Query("main_category_id"); q != "" {
		parsed, err := strconv.ParseUint(q, 10, 64)
		if err != nil {
			c.JSON(400, gin.H{"error": "main_category_id invalid"})
			return
		}
		id := uint(parsed)
		mainCatID = &id
	}

	reviews, err := rc.reviewService.ListMyReviews(memberID, mainCatID)
	if err != nil {
		c.JSON(500, gin.H{"error": "failed to list my reviews", "detail": err.Error()})
		return
	}

	// ✅ Fix old reviews: if deleted but deleted_by_type is empty, set to OWNER
	for i := range reviews {
		if reviews[i].DeletedAt.Valid && reviews[i].DeletedByType == "" {
			// Old review deleted before we added deleted_by_type field
			if reviews[i].AdminDeleteReason != "" {
				reviews[i].DeletedByType = "ADMIN"
			} else {
				reviews[i].DeletedByType = "OWNER"
			}
		}
	}

	c.JSON(200, gin.H{"data": reviews})
}
