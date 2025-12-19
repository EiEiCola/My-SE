package controller

import (
	"strconv"

	"github.com/gin-gonic/gin"
)

// parse path param เป็น uint
func parseUintParam(c *gin.Context, name string) (uint, error) {
	raw := c.Param(name)
	n, err := strconv.Atoi(raw)
	if err != nil || n <= 0 {
		return 0, err
	}
	return uint(n), nil
}

// ดึง adminID จาก context (ตรงกับ middleware ที่ใช้ key "user_id")
func getAdminID(c *gin.Context) (uint, bool) {
	v, ok := c.Get("user_id") // ✅ match jwt_auth.go: c.Set("user_id", claims.UserID)
	if !ok {
		return 0, false
	}
	// JWT middleware stores as uint, so handle both uint and string
	switch id := v.(type) {
	case uint:
		return id, true
	case int:
		return uint(id), true
	case float64:
		return uint(id), true
	case string:
		n, err := strconv.Atoi(id)
		if err != nil || n <= 0 {
			return 0, false
		}
		return uint(n), true
	default:
		return 0, false
	}
}
