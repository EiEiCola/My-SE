package controller

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/internal/app/services"
	"github.com/sut68/team12/backend/internal/dto"
)

type ReviewController struct {
	reviewService services.ReviewService
}

// Constructor
func NewReviewController(reviewService services.ReviewService) *ReviewController {
	return &ReviewController{
		reviewService: reviewService,
	}
}

// ------------------------------------------------------
// POST /api/member/reviews
// สร้างรีวิวใหม่
// ------------------------------------------------------
func (rc *ReviewController) CreateReview(c *gin.Context) {
	var req dto.CreateReviewRequest

	// 1) bind JSON
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":  "invalid request body",
			"detail": err.Error(),
		})
		return
	}

	memberIDAny, ok := c.Get("member_id")
if !ok {
	c.JSON(http.StatusUnauthorized, gin.H{"error": "missing member_id"})
	return
}
req.MemberID = memberIDAny.(uint)

	// กันพลาด: แปลง type ให้ชัวร์
	switch v := memberIDAny.(type) {
	case uint:
		req.MemberID = v
	case int:
		if v < 0 {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid member_id"})
			return
		}
		req.MemberID = uint(v)
	case float64:
		if v < 0 {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid member_id"})
			return
		}
		req.MemberID = uint(v)
	default:
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid member_id type"})
		return
	}

	// 3) call service
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

// ------------------------------------------------------
// GET /api/member/reviews?main_category_id=1
// ดึงรายการรีวิว (สำหรับหน้า list)
// ------------------------------------------------------
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
