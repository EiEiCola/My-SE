package routes

import (
	"github.com/gin-gonic/gin"
	adminCtl "github.com/sut68/team12/backend/internal/app/controller/admin"
)

func SetupMemberCategoryRoutes(r *gin.RouterGroup, ctl *adminCtl.AdminCategoryController) {
	cat := r.Group("/categories")
	{
		cat.GET("/main", ctl.ListMainCategories)
		cat.GET("/sub1", ctl.ListSubCategoryL1)
		cat.GET("/sub2", ctl.ListSubCategoryL2)
	}
}
