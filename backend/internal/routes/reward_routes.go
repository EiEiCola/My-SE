package routes

import (
	"github.com/gin-gonic/gin"

	member "github.com/sut68/team12/backend/internal/app/controller/member"
	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/app/services"
	"github.com/sut68/team12/backend/config"
)

func SetupRewardRoutes(r *gin.RouterGroup) {
	db := config.DB

	// ✅ Shop: แค่ดึงรายการ Reward
	rewardRepo := repository.NewRewardRepository(db)
	rewardSvc := services.NewRewardService(rewardRepo)
	rewardCtl := member.NewRewardController(rewardSvc)

	// ✅ GET /api/rewards
	r.GET("/rewards", rewardCtl.GetAllReward)
}
