package controller

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/dto"
	"github.com/sut68/team12/backend/internal/entity"
)

type AdminReviewController struct {
	ReviewRepo repository.ReviewRepository
}

func NewAdminReviewController(repo repository.ReviewRepository) *AdminReviewController {
	return &AdminReviewController{ReviewRepo: repo}
}

// GET /admin/reviews
func (c *AdminReviewController) ListReviews(ctx *gin.Context) {
	page, _ := strconv.Atoi(ctx.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(ctx.DefaultQuery("pageSize", "10"))
	search := ctx.Query("search")

	reviews, total, err := c.ReviewRepo.ListAllReviews(search, page, pageSize)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	items := make([]dto.AdminReviewListItem, 0, len(reviews))

	for _, r := range reviews {
		var it dto.AdminReviewListItem

		it.ID = r.ID
		it.Title = r.Title
		it.Content = r.Content
		it.Rating = r.Rating
		it.IsAnonymous = r.IsAnonymous
		it.HelpfulCount = r.HelpfulCount
		it.NotHelpfulCount = r.NotHelpfulCount
		it.CreatedAt = r.CreatedAt

		// deleted_at (gorm.DeletedAt)
		if r.DeletedAt.Valid {
			t := r.DeletedAt.Time
			it.DeletedAt = &t
		}

		// admin reason + who deleted
		it.AdminDeleteReason = r.AdminDeleteReason
		it.DeletedByType = r.DeletedByType

		// ✅ กันข้อมูลเก่า: ถ้าโดนลบแล้ว แต่ deleted_by_type ยังว่าง
		if it.DeletedAt != nil && it.DeletedByType == "" {
			if r.AdminDeleteReason != "" {
				it.DeletedByType = "ADMIN"
			} else {
				it.DeletedByType = "OWNER"
			}
		}

		// member
		it.Member.Username = r.Member.Username
		it.Member.MemberPicture = r.Member.MemberPicture

		// main category (optional)
		if r.MainCategoryID != nil {
			it.MainCategory = &struct {
				Title string `json:"title"`
			}{
				Title: r.MainCategory.Title,
			}
		}

		// ✅ sub categories
		if r.SubCategoryL1ID != nil {
			it.SubCategoryL1 = &struct {
				Title string `json:"title"`
			}{
				Title: r.SubCategoryL1.Title,
			}
		}

		if r.SubCategoryL2ID != nil {
			it.SubCategoryL2 = &struct {
				Title string `json:"title"`
			}{
				Title: r.SubCategoryL2.Title,
			}
		}

		// ✅ tags
		for _, tag := range r.Tags {
			it.Tags = append(it.Tags, struct {
				Name string `json:"name"`
			}{
				Name: tag.Name,
			})
		}

		// reports → ส่งแค่จำนวน
		it.ReportCount = len(r.Reports)

		// ✅ review images
		for _, img := range r.ReviewImages {
			it.ReviewImages = append(it.ReviewImages, struct {
				URL string `json:"url"`
			}{
				URL: img.URL,
			})
		}

		items = append(items, it)
	}

	// ✅ Calculate global stats (not just current page)
	var deletedCount int64
	var reportedCount int64

	// Count all deleted reviews
	c.ReviewRepo.DB().Unscoped().Model(&entity.Review{}).Where("deleted_at IS NOT NULL").Count(&deletedCount)

	// ✅ Count unique reviews that have at least one report (not deleted)
	c.ReviewRepo.DB().Model(&entity.Review{}).
		Where("id IN (?)",
			c.ReviewRepo.DB().Table("reports").
				Select("DISTINCT target_id").
				Where("target_type = ?", "Review"),
		).
		Count(&reportedCount)

	ctx.JSON(http.StatusOK, gin.H{
		"data":           items,
		"total":          total,
		"page":           page,
		"deleted_count":  deletedCount,
		"reported_count": reportedCount,
	})
}

// DELETE /admin/reviews/:id
func (c *AdminReviewController) DeleteReview(ctx *gin.Context) {
	idParam := ctx.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var body struct {
		Reason string `json:"reason"`
	}
	if err := ctx.ShouldBindJSON(&body); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "reason is required"})
		return
	}
	if body.Reason == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "reason cannot be empty"})
		return
	}

	// ✅ repo ต้อง set deleted_by_type="ADMIN" + admin_delete_reason + soft delete
	if err := c.ReviewRepo.DeleteReviewByAdmin(uint(id), body.Reason); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "review deleted successfully"})
}
