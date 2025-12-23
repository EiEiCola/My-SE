package routes

import (
	"github.com/gin-gonic/gin"

	"github.com/sut68/team12/backend/config"
	admincontroller "github.com/sut68/team12/backend/internal/app/controller/admin"
	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/app/services"
)

func SetupPointRuleRoutes(r *gin.RouterGroup) {
	db := config.DB

	repo := repository.NewPointRuleRepository(db)
	svc := services.NewPointRuleService(repo)
	ctrl := admincontroller.NewPointRuleController(svc)

	// ✅ PUBLIC / USER (read-only)
	// เส้นนี้จะกลายเป็น: GET /api/point-rules
	r.GET("/point-rules", ctrl.GetAll)
	r.GET("/point-rules/:id", ctrl.GetByID)

	// ✅ ADMIN (CRUD)
	admin := r.Group("/admin")
	{
		admin.POST("/point-rule", ctrl.Create)
		admin.GET("/point-rule", ctrl.GetAll)
		admin.GET("/point-rule/:id", ctrl.GetByID)
		admin.PUT("/point-rule/:id", ctrl.Update)
		admin.DELETE("/point-rule/:id", ctrl.Delete)
	}
}
