package middlewares

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {

		// ตัวอย่าง: ดึง user_id จาก header (ของจริงควรใช้ JWT)
		userID := c.GetHeader("X-User-ID")

		if userID == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			c.Abort()
			return
		}

		c.Set("userID", userID)
		c.Next()
	}
}
