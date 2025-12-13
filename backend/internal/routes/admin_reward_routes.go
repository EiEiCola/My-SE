package routes

import (
	"github.com/gin-gonic/gin"

	"github.com/sut68/team12/backend/config"
	appcontroller "github.com/sut68/team12/backend/internal/app/controller/admin"
	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/app/services"
)

func SetupAdminRewardRoutes(r *gin.RouterGroup) {
	db := config.DB

	repo := repository.NewAdminRewardRepository(db)
	svc := services.NewAdminRewardService(repo)
	ctrl := appcontroller.NewAdminRewardController(svc)

	admin := r.Group("/admin")
	{
		admin.POST("/reward", ctrl.CreateReward)
		admin.GET("/reward", ctrl.GetAllReward)
		admin.GET("/reward/:id", ctrl.GetRewardByID)
		admin.PUT("/reward/:id", ctrl.UpdateReward)
		admin.DELETE("/reward/:id", ctrl.DeleteReward)
	}
}
