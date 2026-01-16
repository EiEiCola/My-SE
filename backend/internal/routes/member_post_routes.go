package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/config"
	memberctl "github.com/sut68/team12/backend/internal/app/controller/member"
	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/app/services"
	"github.com/sut68/team12/backend/internal/app/websocket"
)

// SetupMemberPostRoutes register ใต้ /api/member (protected)
func SetupMemberPostRoutes(r *gin.RouterGroup, wsHub *websocket.Hub) {
	db := config.DB

	postRepo := repository.NewPostRepository(db)
	imgRepo := repository.NewPostImageRepository(db)
	attRepo := repository.NewPostAttachmentRepository(db)
	likeRepo := repository.NewPostLikeRepository(db)
	commentRepo := repository.NewCommentRepository(db)
	bookmarkRepo := repository.NewBookmarkRepository(db)
	postStarRepo := repository.NewPostStarRepository(db)

	// Point & Reward related
	pointRuleRepo := repository.NewPointRuleRepository(db)
	pointTxRepo := repository.NewPointTransactionRepository(db)
	mpbRepo := repository.NewMemberPointBalanceRepository(db)
	notificationRepo := repository.NewNotificationRepository(db)

	// Services
	// --- Added by Point System ---
	// สร้าง pointService เพื่อส่งเข้าไปใน PostService ตามโครงสร้างใหม่
	pointService := services.NewPointService(db)

	// แก้ไขบรรทัดนี้โดยส่ง pointService และ wsHub เข้าไป
	postSvc := services.NewPostService(db, postRepo, imgRepo, attRepo, likeRepo, commentRepo, bookmarkRepo, notificationRepo, pointService, wsHub)

	pointTxSvc := services.NewPointTransactionService(pointTxRepo, pointRuleRepo, mpbRepo)

	// ✅ Needed for resolving Profile ID from Account ID
	memberRepo := repository.NewMemberRepository(db)
	memberSvc := services.NewMemberService(memberRepo)

	postCtrl := memberctl.NewPostController(postSvc, pointTxSvc, pointRuleRepo, postStarRepo, memberSvc, pointService)

	// Report controller
	reportRepo := repository.NewReportRepository(db)
	reportSvc := services.NewReportService(db, reportRepo, postRepo)
	reportCtrl := memberctl.NewMemberReportController(reportSvc, memberSvc)

	posts := r.Group("/posts")
	{
		posts.GET("", postCtrl.GetAllPosts) // GET /api/member/posts
		posts.POST("", postCtrl.CreatePost) // POST /api/member/posts

		// Profile feature routes (MUST be before /:id routes)
		posts.GET("/bookmarked", postCtrl.GetBookmarkedPosts) // GET /api/member/posts/bookmarked
		posts.GET("/mine", postCtrl.GetMyPosts)               // GET /api/member/posts/mine

		// Post by ID routes
		posts.GET("/:id", postCtrl.GetPostByID)   // GET /api/member/posts/:id
		posts.PUT("/:id", postCtrl.UpdatePost)    // PUT /api/member/posts/:id
		posts.DELETE("/:id", postCtrl.DeletePost) // DELETE /api/member/posts/:id

		// Like routes
		posts.GET("/:id/like/status", postCtrl.GetLikeStatus) // GET /api/member/posts/:id/like/status
		posts.POST("/:id/like", postCtrl.ToggleLike)          // POST /api/member/posts/:id/like

		// Comment routes
		posts.GET("/:id/comments", postCtrl.GetComments)    // GET /api/member/posts/:id/comments
		posts.POST("/:id/comments", postCtrl.CreateComment) // POST /api/member/posts/:id/comments

		posts.DELETE("/:id/comments/:commentId", postCtrl.DeleteComment)        // DELETE /api/member/posts/:id/comments/:commentId
		posts.POST("/:id/comments/:commentId/like", postCtrl.ToggleLikeComment) // POST /api/member/posts/:id/comments/:commentId/like

		// Feature routes
		posts.POST("/:id/bookmark", postCtrl.ToggleBookmark) // POST /api/member/posts/:id/bookmark
		posts.POST("/:id/star", postCtrl.SendStar)           // POST /api/member/posts/:id/star
		posts.POST("/:id/report", reportCtrl.ReportPost)     // POST /api/member/posts/:id/report
	}
}
