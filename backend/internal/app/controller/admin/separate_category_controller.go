package controller

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/internal/app/services"
)

type SeparateCategoryController struct {
	AnnCatService *services.AnnouncementCategoryService
	ReportService *services.ReportReasonService
}

func NewSeparateCategoryController(ann *services.AnnouncementCategoryService, rep *services.ReportReasonService) *SeparateCategoryController {
	return &SeparateCategoryController{
		AnnCatService: ann,
		ReportService: rep,
	}
}

func (ctl *SeparateCategoryController) ListAnnouncementCategories(c *gin.Context) {
	items, err := ctl.AnnCatService.FindAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": items})
}

func (ctl *SeparateCategoryController) ListReportReasons(c *gin.Context) {
	items, err := ctl.ReportService.FindAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": items})
}
