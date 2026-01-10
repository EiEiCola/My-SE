package middlewares

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// RequireMemberReviewMiddleware
// ✅ ใช้กับ Review routes เท่านั้น
// หน้าที่: ทำให้มี member_id สำหรับ ReviewController
// โดย map จาก user_id ที่ JWTAuthMiddleware set มา
func RequireMemberReviewMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {

		toUint := func(v any) (uint, bool) {
			switch t := v.(type) {
			case uint:
				return t, true
			case int:
				if t < 0 { return 0, false }
				return uint(t), true
			case int64:
				if t < 0 { return 0, false }
				return uint(t), true
			case float64:
				if t < 0 { return 0, false }
				return uint(t), true
			default:
				return 0, false
			}
		}

		// 0) ถ้ามี member_id อยู่แล้วก็ผ่าน
		if v, ok := c.Get("member_id"); ok {
			if id, ok := toUint(v); ok && id > 0 {
				c.Set("member_id", id)
				c.Next()
				return
			}
		}

		// 1) map จาก JWT -> user_id
		if v, ok := c.Get("user_id"); ok {
			if id, ok := toUint(v); ok && id > 0 {
				c.Set("member_id", id)
				c.Next()
				return
			}
		}

		// 2) ยังไม่มี member_id
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
			"error": "missing member_id",
		})
	}
}
