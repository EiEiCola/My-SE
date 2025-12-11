package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/config"
	"github.com/sut68/team12/backend/internal/routes"
)

const PORT = "8080"

func main() {
	// 1. Setup Database
	config.Connect() // Sets global config.DB

	// 2. Setup Gin
	r := gin.Default()

	// Health check
	r.GET("/health", func(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"status": "ok"}) })

	// 3. Setup Routes (All wiring happens inside here)
	routes.SetupRoutes(r)

	// 4. Run
	r.Run(":" + PORT)
}
