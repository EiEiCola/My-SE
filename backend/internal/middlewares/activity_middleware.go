package middlewares

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/internal/entity"
	"gorm.io/gorm"
)

// ActivityMiddleware updates the last_activity timestamp for authenticated users
func ActivityMiddleware(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Continue processing the request first
		c.Next()

		// After request is processed, update last activity
		memberID, exists := c.Get("memberID")
		if !exists {
			return
		}

		// Update last activity in background (non-blocking)
		go func(id interface{}) {
			now := time.Now()
			db.Model(&entity.Member{}).
				Where("id = ?", id).
				Update("last_activity", now)
		}(memberID)
	}
}
