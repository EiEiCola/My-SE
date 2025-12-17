package tests

import (
	"testing"

	"github.com/sut68/team12/backend/internal/entity"
)

func TestTagValidate_Empty(t *testing.T) {
	tag := entity.Tag{Name: "   "}
	if err := tag.Validate(); err == nil {
		t.Fatalf("expected error, got nil")
	}
}

func TestTagValidate_OK(t *testing.T) {
	tag := entity.Tag{Name: "งานเยอะ"}
	if err := tag.Validate(); err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
}
