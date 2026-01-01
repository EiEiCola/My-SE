package utils

import "strings"

// EscapeLikePattern escapes special LIKE pattern characters to prevent SQL injection
// It escapes backslash, percent, and underscore which are special in SQL LIKE patterns
func EscapeLikePattern(input string) string {
	escaped := strings.ReplaceAll(input, "\\", "\\\\")
	escaped = strings.ReplaceAll(escaped, "%", "\\%")
	escaped = strings.ReplaceAll(escaped, "_", "\\_")
	return escaped
}

// SanitizeString removes potentially dangerous characters from user input
func SanitizeString(input string) string {
	// Trim whitespace
	sanitized := strings.TrimSpace(input)
	// Remove null bytes
	sanitized = strings.ReplaceAll(sanitized, "\x00", "")
	return sanitized
}
