package tests

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/config"
	"github.com/sut68/team12/backend/internal/entity"
	"github.com/sut68/team12/backend/internal/routes"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func newTestRouter(t *testing.T) *gin.Engine {
	t.Helper()
	gin.SetMode(gin.TestMode)

	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open db: %v", err)
	}

	if err := db.AutoMigrate(
		&entity.Member{},
		&entity.MainCategory{},
		&entity.SubCategoryL1{},
		&entity.SubCategoryL2{},
		&entity.Review{},
		&entity.Tag{},
		&entity.ReviewTag{},
		&entity.ReviewImage{},
		&entity.ReviewVote{},
	); err != nil {
		t.Fatalf("migrate: %v", err)
	}

	config.DB = db

	// seed ให้ตรงกับ mockMemberAuth (member_id=1) และ main_category_id=1
	_ = db.Create(&entity.Member{Model: gorm.Model{ID: 1}, Username: "u1"}).Error
	_ = db.Create(&entity.MainCategory{Model: gorm.Model{ID: 1}}).Error

	r := gin.New()
	api := r.Group("/api")
	routes.SetupReviewRoutes(api)
	return r
}

func TestCreateReview_201(t *testing.T) {
	r := newTestRouter(t)

	body := map[string]any{
		"title":            "My Review",
		"content":          "This is long enough content for validation.",
		"rating":           5,
		"is_anonymous":     false,
		"main_category_id": 1,
		"hashtags":         []string{"งานเยอะ"},
	}
	b, _ := json.Marshal(body)

	req := httptest.NewRequest(http.MethodPost, "/api/member/reviews", bytes.NewReader(b))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d, body=%s", w.Code, w.Body.String())
	}
}

func TestVoteReview_200(t *testing.T) {
	r := newTestRouter(t)

	// create review first
	createBody := map[string]any{
		"title":            "R1",
		"content":          "This is long enough content for validation.",
		"rating":           5,
		"main_category_id": 1,
	}
	cb, _ := json.Marshal(createBody)

	req := httptest.NewRequest(http.MethodPost, "/api/member/reviews", bytes.NewReader(cb))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("create expected 201, got %d, body=%s", w.Code, w.Body.String())
	}

	// vote review id=1
	voteBody := map[string]any{"vote_type": "helpful"}
	vb, _ := json.Marshal(voteBody)

	req2 := httptest.NewRequest(http.MethodPost, "/api/member/reviews/1/vote", bytes.NewReader(vb))
	req2.Header.Set("Content-Type", "application/json")
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, req2)

	if w2.Code != http.StatusOK {
		t.Fatalf("vote expected 200, got %d, body=%s", w2.Code, w2.Body.String())
	}
}
