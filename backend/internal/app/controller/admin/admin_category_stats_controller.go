package controller

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// GET /admin/categories/stats
// Returns post/review/poll counts for all categories
func (ctl *AdminCategoryController) GetCategoryStats(c *gin.Context) {
	stats, err := ctl.Service.GetCategoryStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": stats})
}
