package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/config"
	memberctl "github.com/sut68/team12/backend/internal/app/controller/member"
	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/app/services"
)

func SetupMemberRewardRoutes(r *gin.RouterGroup) {
	db := config.DB

	repo := repository.NewMemberRewardRepository(db)
	svc := services.NewMemberRewardService(db, repo)
	ctrl := memberctl.NewMemberRewardController(svc)

	member := r.Group("/member")
	{
		member.POST("/rewards/:id/redeem", ctrl.Redeem)
		member.GET("/my-stickers", ctrl.MyStickers)
		member.GET("/points", ctrl.MyPoints)

	}
}
