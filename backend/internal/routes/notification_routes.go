package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/config"
	memberctl "github.com/sut68/team12/backend/internal/app/controller/member"
	"github.com/sut68/team12/backend/internal/app/repository"
)

func SetupNotificationRoutes(r *gin.RouterGroup) {
	db := config.DB
	notificationRepo := repository.NewNotificationRepository(db)
	notificationCtl := memberctl.NewNotificationController(notificationRepo)

	notifications := r.Group("/notifications")
	{
		notifications.GET("", notificationCtl.GetNotifications)
		notifications.PATCH("/:id/read", notificationCtl.MarkAsRead)
	}
}
