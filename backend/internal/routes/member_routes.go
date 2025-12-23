package routes

import "github.com/gin-gonic/gin"

// SetupMemberRoutes: ยกเลิกการผูก /api/members/* ตรงนี้
// เพราะตอนนี้ routes สมาชิกที่ต้องล็อกอิน จะถูกผูกใน SetupRoutes()
// ใต้ /api/member/* (protected) ผ่าน SetupMemberProfileRoutes(memberAPI)
func SetupMemberRoutes(r *gin.Engine) {
	// ✅ intentionally empty
	// ถ้าจะมี member routes แบบ public จริง ๆ ค่อยใส่ในอนาคต
}
