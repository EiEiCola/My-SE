package controller

import "github.com/sut68/team12/backend/internal/app/services"

type AdminCategoryController struct {
	Service *services.CategoryService
}

func NewAdminCategoryController(s *services.CategoryService) *AdminCategoryController {
	return &AdminCategoryController{Service: s}
}
