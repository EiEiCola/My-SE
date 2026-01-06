package utils

import (
	"errors"
	"strconv"

	"github.com/gin-gonic/gin"
)

// GetMemberIDFromContext extracts member_id from gin context with type safety
func GetMemberIDFromContext(c *gin.Context) (uint, error) {
	val, ok := c.Get("member_id")
	if !ok {
		return 0, errors.New("member_id not found in context")
	}

	switch v := val.(type) {
	case uint:
		return v, nil
	case int:
		return uint(v), nil
	case float64:
		return uint(v), nil
	case string:
		id, err := strconv.ParseUint(v, 10, 32)
		if err != nil {
			return 0, errors.New("invalid member_id format")
		}
		return uint(id), nil
	default:
		return 0, errors.New("invalid member_id type")
	}
}

// GetAdminIDFromContext extracts admin_id from gin context with type safety
func GetAdminIDFromContext(c *gin.Context) (uint, error) {
	val, ok := c.Get("admin_id")
	if !ok {
		return 0, errors.New("admin_id not found in context")
	}

	switch v := val.(type) {
	case uint:
		return v, nil
	case int:
		return uint(v), nil
	case float64:
		return uint(v), nil
	case string:
		id, err := strconv.ParseUint(v, 10, 32)
		if err != nil {
			return 0, errors.New("invalid admin_id format")
		}
		return uint(id), nil
	default:
		return 0, errors.New("invalid admin_id type")
	}
}
