package main

import (
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"github.com/joho/godotenv"
	"github.com/sut68/team12/backend/config"
	"github.com/sut68/team12/backend/config/dataseed"
	controller "github.com/sut68/team12/backend/internal/app/controller/admin"
	memberCtl "github.com/sut68/team12/backend/internal/app/controller/member"
	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/app/services"
	"github.com/sut68/team12/backend/internal/app/websocket"
	"github.com/sut68/team12/backend/internal/routes"
)

const PORT = "8080"

func main() {
	_ = godotenv.Load()

	// 1. Setup Database
	config.Connect()
	db := config.DB

	// 2. Setup Gin
	r := gin.Default()
	allowedOrigins := []string{"http://localhost:5173", "http://localhost:3000"}
	if envOrigins := os.Getenv("ALLOWED_ORIGINS"); envOrigins != "" {
		allowedOrigins = append(allowedOrigins, strings.Split(envOrigins, ",")...)
	}
	// 3. CORS (ต้องมาก่อน SetupRoutes)
	r.Use(cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "X-Admin-ID", "x-idempotency-key", "X-Idempotency-Key"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Health check with database connectivity test
	r.GET("/health", func(c *gin.Context) {
		// Check database connectivity
		if err := config.DB.Exec("SELECT 1").Error; err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"status": "unhealthy",
				"checks": gin.H{
					"database": "down",
					"error":    err.Error(),
				},
			})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"status": "healthy",
			"checks": gin.H{
				"database": "up",
			},
		})
	})

	dataseed.SeedAll(config.DB)
	// ==========================================
	// 🚀 CHAT SYSTEM INITIALIZATION
	// ==========================================

	// 1. WebSocket Hub (✅ Now with DB for status updates)
	hub := websocket.NewHub(db)
	go hub.Run() // ⭐ สำคัญ: ต้อง Run Hub ไม่งั้นแชทไม่วิ่ง

	// 2. Repositories
	chatRepo := repository.NewChatRepository(db)
	friendRepo := repository.NewFriendRepository(db) // ✅ ต้องมี FriendRepo เพื่อเช็ค Block

	// 3. Service (Inject ChatRepo + FriendRepo + Hub)
	// ⭐ แก้ไขจุดที่ผิด: ต้องใส่ friendRepo ด้วย ตามที่แก้ใน Service ล่าสุด
	chatSvc := services.NewChatService(chatRepo, friendRepo, hub)

	// 4. Controller
	chatCtl := memberCtl.NewChatController(chatSvc, hub)

	// 4. Build dependencies (Repo -> Service -> Controller)

	// ---- Admin Profile ----
	adminRepo := repository.NewAdminRepository(db)
	adminSvc := services.NewAdminProfileService(adminRepo)
	adminProfileCtl := controller.NewAdminProfileController(adminSvc)

	// ---- Admin User Manage (Search + Lock/Unlock) ----
	adminUserRepo := repository.NewAdminUserRepository(db)
	adminUserSvc := services.NewAdminUserService(adminUserRepo)
	adminUserCtl := controller.NewAdminUserController(adminUserSvc)

	// ---- Category Management ----
	mainCatRepo := repository.NewMainCategoryRepository(db)
	sub1CatRepo := repository.NewSubCategoryL1Repository(db)
	sub2CatRepo := repository.NewSubCategoryL2Repository(db)
	categorySvc := services.NewCategoryService(db, mainCatRepo, sub1CatRepo, sub2CatRepo)
	categoryCtl := controller.NewAdminCategoryController(categorySvc)

	// ---- Reviews ----
	reviewRepo := repository.NewReviewRepository(db)
	adminReviewCtl := controller.NewAdminReviewController(reviewRepo)

	// 4.1 Upload Controller
	uploadCtl := memberCtl.NewUploadController()

	// 4.2 Member Service (Reuse or Init)
	memberRepo := repository.NewMemberRepository(db)
	memberSvc := services.NewMemberService(memberRepo)

	// 5. Setup Routes (with WebSocket Hub for real-time notifications)
	routes.SetupRoutes(r, adminProfileCtl, adminUserCtl, categoryCtl, chatCtl, adminReviewCtl, uploadCtl, memberSvc, hub)

	// ✅ 6. Start Cleanup Service (Auto-offline inactive users)
	cleanupSvc := services.NewCleanupService(memberRepo, hub)
	cleanupSvc.Start()
	defer cleanupSvc.Stop()

	// 7. Configure HTTP server with timeouts for security and stability
	srv := &http.Server{
		Addr:           ":" + PORT,
		Handler:        r,
		ReadTimeout:    15 * time.Second, // Maximum duration for reading request
		WriteTimeout:   15 * time.Second, // Maximum duration for writing response
		IdleTimeout:    60 * time.Second, // Maximum idle time between requests
		MaxHeaderBytes: 1 << 20,          // 1 MB maximum header size
	}

	// 7. Start server
	println("Server running on http://localhost:" + PORT)
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		panic(err)
	}
}
