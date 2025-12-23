package middlewares

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func RequireAdminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		roleAny, ok := c.Get("role")
		if !ok {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"message": "admin only"})
			return
		}
		role, _ := roleAny.(string)
		if role != "admin" {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"message": "admin only"})
			return
		}
		c.Next()
	}
}
