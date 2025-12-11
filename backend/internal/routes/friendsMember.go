package routes

import (
	"github.com/sut68/team12/backend/internal/app/controller/member"
	"github.com/sut68/team12/backend/internal/middlewares"

	"github.com/gin-gonic/gin"
)

func FriendRoutes(r *gin.Engine,
	reqCtl *controller.FriendRequestController,
	friendCtl *controller.FriendshipController,
	blockCtl *controller.BlockController) {

	f := r.Group("/friends", middlewares.AuthMiddleware())

	f.POST("/send", reqCtl.Send)
	f.POST("/respond", reqCtl.Respond)
	f.POST("/cancel", reqCtl.Cancel)

	f.POST("/unfriend", friendCtl.Unfriend)

	f.POST("/block", blockCtl.Block)
}

// package routes

// import (
// 	"github.com/gin-gonic/gin"
// 	"gorm.io/gorm"

// 	"github.com/sut68/team12/backend/internal/app/controller"
// 	"github.com/sut68/team12/backend/internal/app/repository"
// 	"github.com/sut68/team12/backend/internal/app/services"
// )

// // RegisterFriendRoutes จะรับ gin.Engine และ *gorm.DB เพื่อสร้าง repo/service/controller และ bind routes
// func RegisterFriendRoutes(r *gin.Engine, db *gorm.DB) {
// 	// สร้าง repository, service, controllers
// 	repo := repository.NewFriendRepository(db)
// 	friendService := services.NewFriendService(db, repo)

// 	friendReqCtl := controller.NewFriendRequestController(friendService)
// 	friendshipCtl := controller.NewFriendshipController(friendService)
// 	blockCtl := controller.NewBlockController(friendService)

// 	// group routes ถ้าต้องการ prefix
// 	api := r.Group("/api")
// 	{
// 		// friend requests
// 		api.POST("/members/:id/friend-requests", friendReqCtl.SendFriendRequest)
// 		api.POST("/friend-requests/:id/accept", friendReqCtl.AcceptFriendRequest)
// 		api.POST("/friend-requests/:id/reject", friendReqCtl.RejectFriendRequest)
// 		api.DELETE("/friend-requests/:id", friendReqCtl.CancelFriendRequest)

// 		// friendships
// 		api.GET("/members/:id/friends", friendshipCtl.GetFriends)
// 		api.DELETE("/members/:id/friends/:targetID", friendshipCtl.Unfriend)

// 		// block
// 		api.POST("/members/:id/block/:targetID", blockCtl.BlockMember)
// 		api.DELETE("/members/:id/block/:targetID", blockCtl.UnblockMember)
// 	}
// }
