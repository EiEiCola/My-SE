package routes

import (
	"github.com/gin-gonic/gin"
)

// SetupRoutes initializes all routes
func SetupRoutes(r *gin.Engine){
	// SetupAuthRoutes(r)           // Placeholder for future Auth routes
	// SetupUserPublicRoutes(r)     // Placeholder for Public routes

	api := r.Group("/api")
	// api.Use(middlewares.Authorizes()) 
	{
		SetupPRRoutes(api)
		
		SetupPollRoutes(api)
	}
		SetupMemberRoutes(r) 
}
