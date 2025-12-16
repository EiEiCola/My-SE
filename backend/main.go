package main

import (
	"net/http"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"github.com/sut68/team12/backend/config"
	controller "github.com/sut68/team12/backend/internal/app/controller/admin"
	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/app/services"
	"github.com/sut68/team12/backend/internal/routes"
)

const PORT = "8080"

func main() {
	// 1. Setup Database
	config.Connect()
	db := config.DB

	// 2. Setup Gin
	r := gin.Default()

	// 3. CORS (ต้องมาก่อน SetupRoutes)
	r.Use(cors.New(cors.Config{
  AllowOrigins:     []string{"http://localhost:5173", "http://localhost:3000"},
  AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
  AllowHeaders: []string{
    "Origin",
    "Content-Type",
    "Authorization",
    "X-Admin-ID",
    "x-idempotency-key",
    "X-Idempotency-Key",
  },
  AllowCredentials: true,
  MaxAge:           12 * time.Hour,
}))


	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// 4. Build dependencies (Repo -> Service -> Controller)

	// ---- Admin Profile ----
	adminRepo := repository.NewAdminRepository(db)
	adminSvc := services.NewAdminProfileService(adminRepo)
	adminProfileCtl := controller.NewAdminProfileController(adminSvc)

	// ---- Admin User Manage (Search + Lock/Unlock) ----
	adminUserRepo := repository.NewAdminUserRepository(db)
	adminUserSvc := services.NewAdminUserService(adminUserRepo)
	adminUserCtl := controller.NewAdminUserController(adminUserSvc)

	// 5. Setup Routes
	routes.SetupRoutes(r, adminProfileCtl, adminUserCtl)

	// 6. Run
	r.Run(":" + PORT)
}
