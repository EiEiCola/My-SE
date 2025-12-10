package main

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/config"
	controller "github.com/sut68/team12/backend/internal/app/controller/admin"
	member_controller "github.com/sut68/team12/backend/internal/app/controller/member"
	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/app/services"
	"github.com/sut68/team12/backend/internal/routes"
)

func main() {
	// Connect to Database
	db := config.Connect()
	if db == nil {
		log.Fatal("Failed to connect to database in main")
	}

	// Logging: Database is ready
	log.Println("Database connection established. Initializing app components...")

	// ---------------------------------------------------------
	// Dependency Injection (Clean Architecture)
	// ---------------------------------------------------------

	// 1. Repositories
	annRepo := repository.NewAnnouncementRepository(db)
	prSubmissionRepo := repository.NewPRSubmissionRepository(db)
	prReviewRepo := repository.NewPRReviewRepository(db)

	// 2. Services
	annService := services.NewAnnouncementService(db, annRepo)
	prService := services.NewPRSubmissionService(db, prSubmissionRepo)
	prReviewService := services.NewPRReviewService(db, prSubmissionRepo, prReviewRepo, annRepo)

	// 3. Controllers
	annController := controller.NewAdminAnnouncementController(annService)
	prController := controller.NewAdminPRController(prService, prReviewService)
	memberPRController := member_controller.NewPRSubmissionController(prService)

	// ---------------------------------------------------------

	// SetUp Gin
	r := gin.Default()

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	r.GET("/hello", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "Hello from team12 backend"})
	})

	// Setup Routes (Inject Controllers)
	routes.SetupRoutes(r, db, annController, prController, memberPRController)

	// Friend Routes (Commented out in original, can be enabled if needed)
	// routes.RegisterFriendRoutes(r, db)

	// Run Server
	log.Println("Server starting on :8080")
	r.Run(":8080")
}
