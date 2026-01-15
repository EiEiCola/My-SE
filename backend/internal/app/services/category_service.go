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
		Title:          req.Title,
		Description:    req.Description,
		Icon:           req.Icon,
		OrderIndex:     req.OrderIndex,
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

// -------- Category Stats --------

// categoryCountRow is a helper struct for SQL results
type categoryCountRow struct {
	CategoryID uint
	Count      int
}

// GetCategoryStats returns post/review/poll counts for all categories
func (s *CategoryService) GetCategoryStats() (*dto.CategoryStatsResponse, error) {
	// Get main category stats
	mainStats, err := s.getMainCategoryStats()
	if err != nil {
		return nil, err
	}

	// Get sub1 category stats
	sub1Stats, err := s.getSub1CategoryStats()
	if err != nil {
		return nil, err
	}

	// Get sub2 category stats
	sub2Stats, err := s.getSub2CategoryStats()
	if err != nil {
		return nil, err
	}

	return &dto.CategoryStatsResponse{
		Main: mainStats,
		Sub1: sub1Stats,
		Sub2: sub2Stats,
	}, nil
}

func (s *CategoryService) getMainCategoryStats() ([]dto.CategoryCountStat, error) {
	// Get all main categories first
	var mainCategories []entity.MainCategory
	if err := s.DB.Find(&mainCategories).Error; err != nil {
		return nil, err
	}

	// Count posts by main_category_id
	postCounts := make(map[uint]int)
	var postRows []categoryCountRow
	s.DB.Model(&entity.Post{}).
		Select("main_category_id as category_id, COUNT(*) as count").
		Where("main_category_id IS NOT NULL AND deleted_at IS NULL").
		Group("main_category_id").
		Scan(&postRows)
	for _, row := range postRows {
		postCounts[row.CategoryID] = row.Count
	}

	// Count reviews by main_category_id
	reviewCounts := make(map[uint]int)
	var reviewRows []categoryCountRow
	s.DB.Model(&entity.Review{}).
		Select("main_category_id as category_id, COUNT(*) as count").
		Where("main_category_id IS NOT NULL AND deleted_at IS NULL").
		Group("main_category_id").
		Scan(&reviewRows)
	for _, row := range reviewRows {
		reviewCounts[row.CategoryID] = row.Count
	}

	// Count polls by main_category_id
	pollCounts := make(map[uint]int)
	var pollRows []categoryCountRow
	s.DB.Model(&entity.Poll{}).
		Select("main_category_id as category_id, COUNT(*) as count").
		Where("main_category_id IS NOT NULL AND deleted_at IS NULL").
		Group("main_category_id").
		Scan(&pollRows)
	for _, row := range pollRows {
		pollCounts[row.CategoryID] = row.Count
	}

	// Combine results
	var result []dto.CategoryCountStat
	for _, cat := range mainCategories {
		result = append(result, dto.CategoryCountStat{
			CategoryID:  cat.ID,
			PostCount:   postCounts[cat.ID],
			ReviewCount: reviewCounts[cat.ID],
			PollCount:   pollCounts[cat.ID],
		})
	}

	return result, nil
}

func (s *CategoryService) getSub1CategoryStats() ([]dto.CategoryCountStat, error) {
	// Get all sub1 categories
	var subCategories []entity.SubCategoryL1
	if err := s.DB.Find(&subCategories).Error; err != nil {
		return nil, err
	}

	// Count posts by sub_category1_id (column name from Post entity)
	postCounts := make(map[uint]int)
	var postRows []categoryCountRow
	s.DB.Model(&entity.Post{}).
		Select("sub_category1_id as category_id, COUNT(*) as count").
		Where("sub_category1_id IS NOT NULL AND deleted_at IS NULL").
		Group("sub_category1_id").
		Scan(&postRows)
	for _, row := range postRows {
		postCounts[row.CategoryID] = row.Count
	}

	// Count reviews by sub_category_l1_id
	reviewCounts := make(map[uint]int)
	var reviewRows []categoryCountRow
	s.DB.Model(&entity.Review{}).
		Select("sub_category_l1_id as category_id, COUNT(*) as count").
		Where("sub_category_l1_id IS NOT NULL AND deleted_at IS NULL").
		Group("sub_category_l1_id").
		Scan(&reviewRows)
	for _, row := range reviewRows {
		reviewCounts[row.CategoryID] = row.Count
	}

	// Count polls by sub_category_l1_id
	pollCounts := make(map[uint]int)
	var pollRows []categoryCountRow
	s.DB.Model(&entity.Poll{}).
		Select("sub_category_l1_id as category_id, COUNT(*) as count").
		Where("sub_category_l1_id IS NOT NULL AND deleted_at IS NULL").
		Group("sub_category_l1_id").
		Scan(&pollRows)
	for _, row := range pollRows {
		pollCounts[row.CategoryID] = row.Count
	}

	// Combine results
	var result []dto.CategoryCountStat
	for _, cat := range subCategories {
		result = append(result, dto.CategoryCountStat{
			CategoryID:  cat.ID,
			PostCount:   postCounts[cat.ID],
			ReviewCount: reviewCounts[cat.ID],
			PollCount:   pollCounts[cat.ID],
		})
	}

	return result, nil
}

func (s *CategoryService) getSub2CategoryStats() ([]dto.CategoryCountStat, error) {
	// Get all sub2 categories
	var subCategories []entity.SubCategoryL2
	if err := s.DB.Find(&subCategories).Error; err != nil {
		return nil, err
	}

	// Count posts by sub_category2_id (column name from Post entity)
	postCounts := make(map[uint]int)
	var postRows []categoryCountRow
	s.DB.Model(&entity.Post{}).
		Select("sub_category2_id as category_id, COUNT(*) as count").
		Where("sub_category2_id IS NOT NULL AND deleted_at IS NULL").
		Group("sub_category2_id").
		Scan(&postRows)
	for _, row := range postRows {
		postCounts[row.CategoryID] = row.Count
	}

	// Count reviews by sub_category_l2_id
	reviewCounts := make(map[uint]int)
	var reviewRows []categoryCountRow
	s.DB.Model(&entity.Review{}).
		Select("sub_category_l2_id as category_id, COUNT(*) as count").
		Where("sub_category_l2_id IS NOT NULL AND deleted_at IS NULL").
		Group("sub_category_l2_id").
		Scan(&reviewRows)
	for _, row := range reviewRows {
		reviewCounts[row.CategoryID] = row.Count
	}

	// Count polls by sub_category_l2_id
	pollCounts := make(map[uint]int)
	var pollRows []categoryCountRow
	s.DB.Model(&entity.Poll{}).
		Select("sub_category_l2_id as category_id, COUNT(*) as count").
		Where("sub_category_l2_id IS NOT NULL AND deleted_at IS NULL").
		Group("sub_category_l2_id").
		Scan(&pollRows)
	for _, row := range pollRows {
		pollCounts[row.CategoryID] = row.Count
	}

	// Combine results
	var result []dto.CategoryCountStat
	for _, cat := range subCategories {
		result = append(result, dto.CategoryCountStat{
			CategoryID:  cat.ID,
			PostCount:   postCounts[cat.ID],
			ReviewCount: reviewCounts[cat.ID],
			PollCount:   pollCounts[cat.ID],
		})
	}

	return result, nil
}
