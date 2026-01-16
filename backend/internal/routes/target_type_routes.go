package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/config"
	"github.com/sut68/team12/backend/internal/entity"
)

// SetupTargetTypeRoutes sets up routes for target types (public)
func SetupTargetTypeRoutes(api *gin.RouterGroup) {
	api.GET("/categories/target-types", listTargetTypes)
}

// GET /api/categories/target-types
func listTargetTypes(c *gin.Context) {
	var targetTypes []entity.TargetType
	if err := config.DB.Order("display_order ASC").Find(&targetTypes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch target types"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"data": targetTypes,
	})
}
