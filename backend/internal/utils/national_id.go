// backend/internal/utils/national_id.go
package utils

import (
  "crypto/hmac"
  "crypto/sha256"
  "encoding/hex"
  "os"
  "regexp"
  "strings"
)

var re13 = regexp.MustCompile(`^\d{13}$`)

func NormalizeNationalID(s string) string {
  return strings.TrimSpace(s)
}

func ValidateNationalID13(s string) bool {
  return re13.MatchString(s)
}

func Last4(s string) string {
  if len(s) < 4 {
    return ""
  }
  return s[len(s)-4:]
}

func HashNationalID(nationalID string) string {
  secret := os.Getenv("NATIONAL_ID_SECRET")
  if secret == "" {
    // กันพังตอน dev: แต่แนะนำให้ตั้ง env เสมอ
    secret = "dev-secret-change-me"
  }
  mac := hmac.New(sha256.New, []byte(secret))
  mac.Write([]byte(nationalID))
  return hex.EncodeToString(mac.Sum(nil))
}
