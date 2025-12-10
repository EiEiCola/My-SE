package main

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/config"
	"github.com/sut68/team12/backend/internal/routes"
)

func main() {
	// Connect to Database
	db := config.Connect()
	if db == nil {
		log.Fatal("Failed to connect to database in main")
	}

	// SetUp Gin
	r := gin.Default()

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	r.GET("/hello", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "Hello from team12 backend"})
	})

	// Setup Routes
	routes.SetupRoutes(r, db)

	// Friend Routes (Commented out in original, can be enabled if needed)
	// routes.RegisterFriendRoutes(r, db)

	// Run Server
	r.Run(":8080")
}
