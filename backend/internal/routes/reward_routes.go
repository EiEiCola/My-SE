package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/config"

	member "github.com/sut68/team12/backend/internal/app/controller/member"
	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/app/services"
)

func SetupRewardRoutes(r *gin.RouterGroup) {
	db := config.DB

	rewardRepo := repository.NewRewardRepository(db)
	rewardSvc := services.NewRewardService(rewardRepo)
	rewardCtl := member.NewRewardController(rewardSvc)

	// ✅ public
	r.GET("/rewards", rewardCtl.GetAllReward)
	r.GET("/rewards/:id", rewardCtl.GetRewardByID) // ✅ เพิ่ม
}
