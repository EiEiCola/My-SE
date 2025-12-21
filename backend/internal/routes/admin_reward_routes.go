package routes

import (
	"github.com/gin-gonic/gin"

	"github.com/sut68/team12/backend/config"
	appcontroller "github.com/sut68/team12/backend/internal/app/controller/admin"
	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/app/services"
)

// ✅ รับ group ที่ถูก protect แล้ว (เช่น /api/admin)
func SetupAdminRewardRoutes(adminAPI *gin.RouterGroup) {
	db := config.DB

	repo := repository.NewAdminRewardRepository(db)
	svc := services.NewAdminRewardService(repo)
	ctrl := appcontroller.NewAdminRewardController(svc)

	// ✅ อยู่ใต้ /api/admin โดยตรง
	adminAPI.POST("/reward", ctrl.CreateReward)
	adminAPI.GET("/reward", ctrl.GetAllReward)
	adminAPI.GET("/reward/:id", ctrl.GetRewardByID)
	adminAPI.PUT("/reward/:id", ctrl.UpdateReward)
	adminAPI.DELETE("/reward/:id", ctrl.DeleteReward)
}
