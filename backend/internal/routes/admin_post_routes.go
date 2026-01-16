package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/config"
	adminctl "github.com/sut68/team12/backend/internal/app/controller/admin"
	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/app/services"
	"github.com/sut68/team12/backend/internal/app/websocket"
)

// SetupAdminPostRoutes register ใต้ /api/admin (protected + admin only)
func SetupAdminPostRoutes(r *gin.RouterGroup, wsHub *websocket.Hub) {
	db := config.DB

	postRepo := repository.NewPostRepository(db)
	imgRepo := repository.NewPostImageRepository(db)
	attRepo := repository.NewPostAttachmentRepository(db)
	likeRepo := repository.NewPostLikeRepository(db)
	commentRepo := repository.NewCommentRepository(db)
	bookmarkRepo := repository.NewBookmarkRepository(db)
	notificationRepo := repository.NewNotificationRepository(db)

	// --- Added by Point System ---
	// สร้าง pointService เพื่อให้ NewPostService มี arguments ครบตามที่แก้ไขใน service
	pointService := services.NewPointService(db)

	// เพิ่ม pointService และ wsHub เข้าไป
	postSvc := services.NewPostService(db, postRepo, imgRepo, attRepo, likeRepo, commentRepo, bookmarkRepo, notificationRepo, pointService, wsHub)

	postCtrl := adminctl.NewAdminPostController(postSvc)

	posts := r.Group("/posts")
	{
		posts.GET("", postCtrl.GetAllPosts)            // GET /api/admin/posts
		posts.POST("/:id/delete", postCtrl.DeletePost) // POST /api/admin/posts/:id/delete
	}
}
