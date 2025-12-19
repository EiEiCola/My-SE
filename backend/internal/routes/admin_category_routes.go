package routes

import (
	"github.com/gin-gonic/gin"
	controller "github.com/sut68/team12/backend/internal/app/controller/admin"
)

func SetupAdminCategoryRoutes(api *gin.RouterGroup, ctl *controller.AdminCategoryController) {
	// api is already /api/admin with JWT auth from router.go
	categories := api.Group("/categories")
	// No additional auth middleware needed - parent group already has JWTAuthMiddleware + RequireAdminMiddleware

	// Main Category -> /api/admin/categories/main
	categories.GET("/main", ctl.ListMainCategories)
	categories.GET("/main/:id", ctl.GetMainCategory)
	categories.POST("/main", ctl.CreateMainCategory)
	categories.PUT("/main/:id", ctl.UpdateMainCategory)
	categories.DELETE("/main/:id", ctl.DeleteMainCategory)

	// Sub Category L1 -> /api/admin/categories/sub1
	categories.GET("/sub1", ctl.ListSubCategoryL1)
	categories.GET("/sub1/:id", ctl.GetSubCategoryL1)
	categories.POST("/sub1", ctl.CreateSubCategoryL1)
	categories.PUT("/sub1/:id", ctl.UpdateSubCategoryL1)
	categories.DELETE("/sub1/:id", ctl.DeleteSubCategoryL1)

	// Sub Category L2 -> /api/admin/categories/sub2
	categories.GET("/sub2", ctl.ListSubCategoryL2)
	categories.GET("/sub2/:id", ctl.GetSubCategoryL2)
	categories.POST("/sub2", ctl.CreateSubCategoryL2)
	categories.PUT("/sub2/:id", ctl.UpdateSubCategoryL2)
	categories.DELETE("/sub2/:id", ctl.DeleteSubCategoryL2)
}
