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

// ดึง adminID จาก context (ตรงกับ middleware ที่ใช้ key "userID")
func getAdminID(c *gin.Context) (uint, bool) {
	v, ok := c.Get("userID")
	if !ok {
		return 0, false
	}
	// middleware stores as string, so convert to uint
	str, ok := v.(string)
	if !ok {
		return 0, false
	}
	n, err := strconv.Atoi(str)
	if err != nil || n <= 0 {
		return 0, false
	}
	return uint(n), true
}
