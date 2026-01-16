package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/config"
	memberctl "github.com/sut68/team12/backend/internal/app/controller/member"
	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/app/services"
)

// ✅ register ใต้ /api/member (protect แล้วจาก SetupRoutes)
func SetupMemberProfileRoutes(r *gin.RouterGroup) {
	db := config.DB

	memberRepo := repository.NewMemberRepository(db)
	memberSvc := services.NewMemberService(memberRepo)
	memberCtrl := memberctl.NewMemberController(memberSvc)

	// ✅ /api/member/me
	r.GET("/me", memberCtrl.GetMe)
	r.PUT("/me", memberCtrl.UpdateMe)

	// ✅ Activity tracking - Heartbeat endpoint
	activityCtrl := memberctl.NewActivityController(memberRepo)
	r.POST("/heartbeat", activityCtrl.Heartbeat)

	// (ถ้าจะเก็บของเดิมไว้ด้วยก็ได้)
	// r.GET("/account/:accountId", memberCtrl.GetProfileByAccountID)
	// r.PUT("/account/:accountId", memberCtrl.UpdateProfileByAccountID)
}
