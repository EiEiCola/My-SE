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

	// ✅ r ที่ส่งเข้ามา “คือ /api/member แล้ว” (จาก router.go)
	r.POST("/rewards/:id/redeem", ctrl.Redeem)
	r.GET("/my-stickers", ctrl.MyStickers)
	r.GET("/points", ctrl.MyPoints)
}
