package main

import (
	"net/http"
	// "log"

	// "github.com/sut68/team12/backend/internal/routes"
	"github.com/sut68/team12/backend/config"
	// "github.com/sut68/team12/backend/internal/app/controller/member"
	// "github.com/sut68/team12/backend/internal/app/repository"
	// "github.com/sut68/team12/backend/internal/app/services"

	// "gorm.io/driver/postgres" // หรือ mysql driver ตาม DB ของคุณ
	// "gorm.io/gorm"
	"github.com/gin-gonic/gin"
)

func main() {

// ตัวอย่าง connect postgres - แก้ DSN ตามจริง
	
	// repo := repository.NewFriendRepository(db)
	// svc := services.NewFriendService(repo)

	// reqCtl := controller.NewFriendRequestController(svc)
	// friendCtl := controller.NewFriendshipController(svc)
	// blockCtl := controller.NewBlockController(svc)

	config.Connect()

	//SetUpGin
	r := gin.Default()

	// health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// ตัวอย่าง endpoint
	r.GET("/hello", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "Hello from team12 backend"})
	})

	// register routes from routes/friendsManage.go

	// routes.FriendRoutes(r, reqCtl, friendCtl, blockCtl)

	r.Run(":8080") // listen on 8080
}