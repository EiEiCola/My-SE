package middlewares

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// RequireAdminPollMiddleware
// ใช้เฉพาะ poll admin routes เพื่อให้ "มี admin_id" แน่นอน
// ไม่กระทบ RequireAdminMiddleware เดิมของเพื่อน
func RequireAdminPollMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {

		// helper: convert any -> uint
		toUint := func(v any) (uint, bool) {
			switch t := v.(type) {
			case uint:
				return t, true
			case int:
				if t < 0 {
					return 0, false
				}
				return uint(t), true
			case int64:
				if t < 0 {
					return 0, false
				}
				return uint(t), true
			case float64:
				if t < 0 {
					return 0, false
				}
				return uint(t), true
			default:
				return 0, false
			}
		}

		// 1) ต้องเป็น admin ก่อน (อิง role ที่ JWTAuthMiddleware set มา)
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

		// 2) ถ้ามี admin_id อยู่แล้ว (บางระบบ set มาแล้ว)
		if v, ok := c.Get("admin_id"); ok {
			if id, ok := toUint(v); ok {
				c.Set("admin_id", id)
				c.Next()
				return
			}
		}

		// 3) map จาก key ที่พบบ่อย: id / user_id
		if v, ok := c.Get("id"); ok {
			if id, ok := toUint(v); ok {
				c.Set("admin_id", id)
				c.Next()
				return
			}
		}
		if v, ok := c.Get("user_id"); ok {
			if id, ok := toUint(v); ok {
				c.Set("admin_id", id)
				c.Next()
				return
			}
		}

		// 4) ยังไม่มี id ให้ใช้งาน
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "admin_id not found"})
	}
}
