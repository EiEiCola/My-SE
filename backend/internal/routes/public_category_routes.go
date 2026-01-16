package routes

import (
	"github.com/gin-gonic/gin"
	controller "github.com/sut68/team12/backend/internal/app/controller/admin"
	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/app/services"
	"gorm.io/gorm"
)

func SetupPublicCategoryRoutes(r *gin.Engine, db *gorm.DB) {
	// Repositories
	mainRepo := repository.NewMainCategoryRepository(db)
	sub1Repo := repository.NewSubCategoryL1Repository(db)
	sub2Repo := repository.NewSubCategoryL2Repository(db)

	// Services
	categoryService := services.NewCategoryService(db, mainRepo, sub1Repo, sub2Repo)

	// Controllers
	categoryController := controller.NewAdminCategoryController(categoryService)

	// Separate Categories
	annCatService := services.NewAnnouncementCategoryService(db)
	reportReasonService := services.NewReportReasonService(db)
	sepCatController := controller.NewSeparateCategoryController(annCatService, reportReasonService)

	api := r.Group("/api")
	{
		// Public Category Routes
		categories := api.Group("/categories")
		{
			categories.GET("/main", categoryController.ListMainCategories)
			categories.GET("/sub1", categoryController.ListSubCategoryL1)
			categories.GET("/sub2", categoryController.ListSubCategoryL2)

			categories.GET("/main/:id", categoryController.GetMainCategory)
			categories.GET("/sub1/:id", categoryController.GetSubCategoryL1)
			categories.GET("/sub2/:id", categoryController.GetSubCategoryL2)

			// New Separate Categories
			categories.GET("/announcement", sepCatController.ListAnnouncementCategories)
			categories.GET("/report", sepCatController.ListReportReasons)
		}
	}
}
