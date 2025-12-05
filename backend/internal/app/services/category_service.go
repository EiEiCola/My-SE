package services

import (
	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/dto"
	"github.com/sut68/team12/backend/internal/entity"
	"gorm.io/gorm"
)

type CategoryService struct {
	DB       *gorm.DB
	MainRepo *repository.MainCategoryRepository
	Sub1Repo *repository.SubCategoryL1Repository
	Sub2Repo *repository.SubCategoryL2Repository
}

func NewCategoryService(
	db *gorm.DB,
	mainRepo *repository.MainCategoryRepository,
	sub1Repo *repository.SubCategoryL1Repository,
	sub2Repo *repository.SubCategoryL2Repository,
) *CategoryService {
	return &CategoryService{
		DB:       db,
		MainRepo: mainRepo,
		Sub1Repo: sub1Repo,
		Sub2Repo: sub2Repo,
	}
}

// -------- MainCategory --------

func (s *CategoryService) ListMainCategories() ([]entity.MainCategory, error) {
	return s.MainRepo.FindAll()
}

func (s *CategoryService) GetMainCategoryByID(id uint) (*entity.MainCategory, error) {
	return s.MainRepo.FindByID(id)
}

func (s *CategoryService) CreateMainCategory(adminID uint, req dto.CreateMainCategoryRequest) (*entity.MainCategory, error) {
	m := &entity.MainCategory{
		Title:         req.Title,
		Description:   req.Description,
		Icon:          req.Icon,
		OrderIndex:    req.OrderIndex,
		CreatedByAdmin: adminID,
	}

	if err := s.MainRepo.Create(m); err != nil {
		return nil, err
	}
	return m, nil
}

func (s *CategoryService) UpdateMainCategory(id uint, req dto.UpdateMainCategoryRequest) (*entity.MainCategory, error) {
	m, err := s.MainRepo.FindByID(id)
	if err != nil {
		return nil, err
	}

	if req.Title != nil {
		m.Title = *req.Title
	}
	if req.Description != nil {
		m.Description = *req.Description
	}
	if req.Icon != nil {
		m.Icon = *req.Icon
	}
	if req.OrderIndex != nil {
		m.OrderIndex = *req.OrderIndex
	}

	if err := s.MainRepo.Update(m); err != nil {
		return nil, err
	}
	return m, nil
}

func (s *CategoryService) DeleteMainCategory(id uint) error {
	return s.MainRepo.Delete(id)
}

// -------- SubCategoryL1 --------

func (s *CategoryService) ListSubCategoryL1(mainID *uint) ([]entity.SubCategoryL1, error) {
	return s.Sub1Repo.FindAll(mainID)
}

func (s *CategoryService) GetSubCategoryL1ByID(id uint) (*entity.SubCategoryL1, error) {
	return s.Sub1Repo.FindByID(id)
}

func (s *CategoryService) CreateSubCategoryL1(adminID uint, req dto.CreateSubCategoryL1Request) (*entity.SubCategoryL1, error) {
	m := &entity.SubCategoryL1{
		Title:          req.Title,
		Description:    req.Description,
		OrderIndex:     req.OrderIndex,
		MainCategoryID: req.MainCategoryID,
		CreatedByAdmin: adminID,
	}

	if err := s.Sub1Repo.Create(m); err != nil {
		return nil, err
	}
	return m, nil
}

func (s *CategoryService) UpdateSubCategoryL1(id uint, req dto.UpdateSubCategoryL1Request) (*entity.SubCategoryL1, error) {
	m, err := s.Sub1Repo.FindByID(id)
	if err != nil {
		return nil, err
	}

	if req.Title != nil {
		m.Title = *req.Title
	}
	if req.Description != nil {
		m.Description = *req.Description
	}
	if req.OrderIndex != nil {
		m.OrderIndex = *req.OrderIndex
	}

	if err := s.Sub1Repo.Update(m); err != nil {
		return nil, err
	}
	return m, nil
}

func (s *CategoryService) DeleteSubCategoryL1(id uint) error {
	return s.Sub1Repo.Delete(id)
}

// -------- SubCategoryL2 --------

func (s *CategoryService) ListSubCategoryL2(sub1ID *uint) ([]entity.SubCategoryL2, error) {
	return s.Sub2Repo.FindAll(sub1ID)
}

func (s *CategoryService) GetSubCategoryL2ByID(id uint) (*entity.SubCategoryL2, error) {
	return s.Sub2Repo.FindByID(id)
}

func (s *CategoryService) CreateSubCategoryL2(adminID uint, req dto.CreateSubCategoryL2Request) (*entity.SubCategoryL2, error) {
	m := &entity.SubCategoryL2{
		Title:           req.Title,
		Description:     req.Description,
		OrderIndex:      req.OrderIndex,
		SubCategoryL1ID: req.SubCategoryL1ID,
		CreatedByAdmin:  adminID,
	}

	if err := s.Sub2Repo.Create(m); err != nil {
		return nil, err
	}
	return m, nil
}

func (s *CategoryService) UpdateSubCategoryL2(id uint, req dto.UpdateSubCategoryL2Request) (*entity.SubCategoryL2, error) {
	m, err := s.Sub2Repo.FindByID(id)
	if err != nil {
		return nil, err
	}

	if req.Title != nil {
		m.Title = *req.Title
	}
	if req.Description != nil {
		m.Description = *req.Description
	}
	if req.OrderIndex != nil {
		m.OrderIndex = *req.OrderIndex
	}

	if err := s.Sub2Repo.Update(m); err != nil {
		return nil, err
	}
	return m, nil
}

func (s *CategoryService) DeleteSubCategoryL2(id uint) error {
	return s.Sub2Repo.Delete(id)
}
