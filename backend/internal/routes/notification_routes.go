package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/config"
	memberctl "github.com/sut68/team12/backend/internal/app/controller/member"
	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/app/services"
)

func SetupNotificationRoutes(r *gin.RouterGroup) {
	db := config.DB
	notificationRepo := repository.NewNotificationRepository(db)

	// ✅ สร้าง MemberService เพื่อแปลง Account ID → Member ID
	memberRepo := repository.NewMemberRepository(db)
	memberService := services.NewMemberService(memberRepo)

	notificationCtl := memberctl.NewNotificationController(notificationRepo, memberService)

	notifications := r.Group("/notifications")
	{
		notifications.GET("", notificationCtl.GetNotifications)
		notifications.PATCH("/:id/read", notificationCtl.MarkAsRead)
		notifications.PATCH("/read-all", notificationCtl.MarkAllAsRead) // ✅ อ่านทั้งหมด
		notifications.DELETE("/read", notificationCtl.DeleteRead)       // ✅ ลบที่อ่านแล้ว
	}
}
