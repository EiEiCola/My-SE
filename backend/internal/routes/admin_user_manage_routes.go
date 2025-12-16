package routes

import (
	"github.com/gin-gonic/gin"
	controller "github.com/sut68/team12/backend/internal/app/controller/admin"
)

func SetupAdminUserManageRoutes(api *gin.RouterGroup, ctl *controller.AdminUserController) {
	admin := api.Group("/admin")
	{
		admin.GET("/users", ctl.SearchUsers)
		admin.PATCH("/users/:id/lock", ctl.LockUser)
		admin.PATCH("/users/:id/unlock", ctl.UnlockUser)
	}
}
