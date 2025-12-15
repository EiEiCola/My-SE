package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/internal/app/controller/admin"
	"github.com/sut68/team12/backend/internal/middlewares"
)

func SetupAdminCategoryRoutes(api *gin.RouterGroup, ctl *controller.AdminCategoryController) {
	admin := api.Group("/admin")
	admin.Use(middlewares.AuthMiddleware())

	// Main Category
	admin.GET("/categories/main", ctl.ListMainCategories)
	admin.GET("/categories/main/:id", ctl.GetMainCategory)
	admin.POST("/categories/main", ctl.CreateMainCategory)
	admin.PUT("/categories/main/:id", ctl.UpdateMainCategory)
	admin.DELETE("/categories/main/:id", ctl.DeleteMainCategory)

	// Sub Category L1
	admin.GET("/categories/sub1", ctl.ListSubCategoryL1)
	admin.GET("/categories/sub1/:id", ctl.GetSubCategoryL1)
	admin.POST("/categories/sub1", ctl.CreateSubCategoryL1)
	admin.PUT("/categories/sub1/:id", ctl.UpdateSubCategoryL1)
	admin.DELETE("/categories/sub1/:id", ctl.DeleteSubCategoryL1)

	// Sub Category L2
	admin.GET("/categories/sub2", ctl.ListSubCategoryL2)
	admin.GET("/categories/sub2/:id", ctl.GetSubCategoryL2)
	admin.POST("/categories/sub2", ctl.CreateSubCategoryL2)
	admin.PUT("/categories/sub2/:id", ctl.UpdateSubCategoryL2)
	admin.DELETE("/categories/sub2/:id", ctl.DeleteSubCategoryL2)
}
