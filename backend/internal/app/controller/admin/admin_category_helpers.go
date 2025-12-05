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

// ดึง adminID จาก context (แก้ key ให้ตรงกับ middleware ของคุณ)
func getAdminID(c *gin.Context) (uint, bool) {
	v, ok := c.Get("admin_id") // ถ้า middleware คุณใช้ key อื่น เช่น "user_id" ก็เปลี่ยนตรงนี้
	if !ok {
		return 0, false
	}
	id, ok := v.(uint)
	if !ok {
		return 0, false
	}
	return id, true
}
