package utils

import (
	"log"

	"github.com/gin-gonic/gin"
)

// RespondInternalError logs the actual error and returns a generic error message to the client
// This prevents sensitive information leakage through error messages
func RespondInternalError(c *gin.Context, err error, context string) {
	log.Printf("[ERROR] %s: %v", context, err)
	c.JSON(500, gin.H{"error": "Internal server error"})
}

// RespondError responds with a sanitized error message
func RespondError(c *gin.Context, status int, message string) {
	c.JSON(status, gin.H{"error": message})
}
