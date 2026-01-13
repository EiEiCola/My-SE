package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/config"
	adminctl "github.com/sut68/team12/backend/internal/app/controller/admin"
	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/app/services"
)

// SetupAdminPostRoutes register ใต้ /api/admin (protected + admin only)
func SetupAdminPostRoutes(r *gin.RouterGroup) {
	db := config.DB

	postRepo := repository.NewPostRepository(db)
	imgRepo := repository.NewPostImageRepository(db)
	attRepo := repository.NewPostAttachmentRepository(db)
	likeRepo := repository.NewPostLikeRepository(db)
	commentRepo := repository.NewCommentRepository(db)
	bookmarkRepo := repository.NewBookmarkRepository(db)

	// --- Added by Point System ---
	// สร้าง pointService เพื่อให้ NewPostService มี arguments ครบตามที่แก้ไขใน service
	pointService := services.NewPointService(db)

	// เพิ่ม pointService เข้าไปเป็นตัวแปรสุดท้าย (ตัวที่ 8)
	postSvc := services.NewPostService(db, postRepo, imgRepo, attRepo, likeRepo, commentRepo, bookmarkRepo, pointService)
	
	postCtrl := adminctl.NewAdminPostController(postSvc)

	posts := r.Group("/posts")
	{
		posts.GET("", postCtrl.GetAllPosts)       // GET /api/admin/posts
		posts.DELETE("/:id", postCtrl.DeletePost) // DELETE /api/admin/posts/:id
	}
}