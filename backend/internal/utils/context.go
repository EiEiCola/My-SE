package utils

import (
	"errors"
	"strconv"

	"github.com/gin-gonic/gin"
)

// GetUserID extracts the user_id (or member_id) from the context and returns it as uint.
// It handles various types that might be stored in the context (string, int, float, uint).
// It checks both "user_id" and "member_id" for backward compatibility.
func GetUserID(c *gin.Context) (uint, error) {
	// Try "user_id" first (standard from JWTAuthMiddleware)
	val, ok := c.Get("user_id")
	if !ok {
		// Try "member_id" as fallback (for compatibility with older routes)
		val, ok = c.Get("member_id")
		if !ok {
			return 0, errors.New("missing user id in context")
		}
	}

	switch v := val.(type) {
	case uint:
		return v, nil
	case int:
		return uint(v), nil
	case float64:
		return uint(v), nil
	case string:
		if n, err := strconv.ParseUint(v, 10, 64); err == nil {
			return uint(n), nil
		}
		if n, err := strconv.Atoi(v); err == nil {
			return uint(n), nil
		}
	}

	return 0, errors.New("invalid user id format")
}
