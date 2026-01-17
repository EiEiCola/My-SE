package middlewares

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/internal/utils"
)

// ✅ ชื่อที่ routes.go เรียกใช้
func JWTAuthMiddleware() gin.HandlerFunc { return JWTAuth() }

// ✅ ชื่อเดิม
func JWTAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		// ✅ Allow OPTIONS requests (CORS preflight) to pass through
		if c.Request.Method == "OPTIONS" {
			c.Next()
			return
		}

		h := strings.TrimSpace(c.GetHeader("Authorization"))
		if h == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "missing token"})
			return
		}

		parts := strings.SplitN(h, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" || strings.TrimSpace(parts[1]) == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "invalid auth header"})
			return
		}

		token := strings.TrimSpace(parts[1])
		claims, err := utils.ParseToken(token)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "invalid token"})
			return
		}

		// เซตไว้หลายชื่อเพื่อให้ Controller ทุกตัวดึงไปใช้ได้ถูกต้อง
		c.Set("user_id", claims.UserID)
		c.Set("userID", claims.UserID)
		c.Set("memberID", claims.UserID)

		c.Set("role", claims.Role)
		c.Next()
	}
}
