package controller

import (
	"net/http"

	// แก้ path ให้ตรงกับ module ของโปรเจกต์หนู
	"github.com/sut68/team12/backend/internal/app/services"
	"github.com/sut68/team12/backend/internal/dto"
	"github.com/gin-gonic/gin"
)

type ReviewController struct {
	reviewService services.ReviewService
}

// Constructor เอาไว้ให้ router สร้าง controller
func NewReviewController(reviewService services.ReviewService) *ReviewController {
	return &ReviewController{
		reviewService: reviewService,
	}
}

// ------------------------------------------------------
// POST /api/member/reviews
// สร้างรีวิวใหม่ (เวอร์ชันพื้นฐานก่อน)
// ------------------------------------------------------
func (rc *ReviewController) CreateReview(c *gin.Context) {
	var req dto.CreateReviewRequest

	// 1) bind JSON จาก request body → DTO
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "invalid request body",
			"detail": err.Error(),
		})
		return
	}

	// TODO ภายหลัง: ดึง memberID จาก JWT แทนการอ่านจาก body
	// memberIDFromToken, _ := c.Get("member_id")
	// req.MemberID = memberIDFromToken.(uint)

	// 2) เรียก service ให้จัดการ logic การสร้างรีวิว
	review, err := rc.reviewService.CreateReview(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":  "failed to create review",
			"detail": err.Error(),
		})
		return
	}

	// 3) ส่ง response กลับ (ตอนนี้ส่ง entity ตรง ๆ ไปก่อนก็ได้)
	// ภายหลังค่อย map เป็น dto.ReviewResponse ถ้าอยากควบคุม field ที่โชว์
	c.JSON(http.StatusCreated, gin.H{
		"message": "review created successfully",
		"data":    review,
	})
}
