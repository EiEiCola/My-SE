package utils

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// TODO: แนะนำให้อ่านจาก ENV ทีหลัง (เช่น JWT_SECRET)
// ตอนนี้ให้ใช้ค่าเดิมไปก่อน
var JwtSecret = []byte("CHANGE_ME")

type Claims struct {
	UserID uint   `json:"user_id"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

func SignToken(userID uint, role string) (string, error) {
	if userID == 0 {
		return "", errors.New("userID is required")
	}
	if role == "" {
		return "", errors.New("role is required")
	}

	claims := Claims{
		UserID: userID,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
		},
	}

	t := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return t.SignedString(JwtSecret)
}

func ParseToken(tokenStr string) (*Claims, error) {
	if tokenStr == "" {
		return nil, errors.New("token is required")
	}

	t, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if token.Method.Alg() != jwt.SigningMethodHS256.Alg() {
			return nil, errors.New("unexpected signing method")
		}
		return JwtSecret, nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := t.Claims.(*Claims)
	if !ok || !t.Valid {
		return nil, jwt.ErrTokenInvalidClaims
	}

	if claims.UserID == 0 {
		return nil, jwt.ErrTokenInvalidClaims
	}

	return claims, nil
}

// -------------------- reset token (forgot password) --------------------

type ResetClaims struct {
	UserID   uint   `json:"user_id"`
	Purpose  string `json:"purpose"`
	jwt.RegisteredClaims
}

// อายุสั้น (10 นาที)
func SignResetToken(userID uint) (string, error) {
	if userID == 0 {
		return "", errors.New("userID is required")
	}

	claims := ResetClaims{
		UserID:  userID,
		Purpose: "reset",
		RegisteredClaims: jwt.RegisteredClaims{
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(10 * time.Minute)),
		},
	}

	t := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return t.SignedString(JwtSecret)
}

func ParseResetToken(tokenStr string) (*ResetClaims, error) {
	if tokenStr == "" {
		return nil, errors.New("token is required")
	}

	t, err := jwt.ParseWithClaims(tokenStr, &ResetClaims{}, func(token *jwt.Token) (interface{}, error) {
		if token.Method.Alg() != jwt.SigningMethodHS256.Alg() {
			return nil, errors.New("unexpected signing method")
		}
		return JwtSecret, nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := t.Claims.(*ResetClaims)
	if !ok || !t.Valid {
		return nil, jwt.ErrTokenInvalidClaims
	}

	if claims.UserID == 0 || claims.Purpose != "reset" {
		return nil, jwt.ErrTokenInvalidClaims
	}

	return claims, nil
}
