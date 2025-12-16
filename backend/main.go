package main

import (
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/config"
	"github.com/sut68/team12/backend/internal/routes"
)

const PORT = "8080"

func main() {
	// 1. Setup Database
	config.Connect()

	// 2. Setup Gin
	r := gin.Default()

	// ✅ CORS (ต้องมาก่อน SetupRoutes)
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// 3. Setup Routes
	routes.SetupRoutes(r)

	// 4. Run
	r.Run(":" + PORT)
}
