package repository

import (
	"github.com/sut68/team12/backend/internal/dto"
	"github.com/sut68/team12/backend/internal/entity"
	"gorm.io/gorm"
)

// CategoryStatsRepository handles counting posts/reviews/polls per category
type CategoryStatsRepository struct {
	DB *gorm.DB
}

func NewCategoryStatsRepository(db *gorm.DB) *CategoryStatsRepository {
	return &CategoryStatsRepository{DB: db}
}

// categoryCountRow is a helper struct for raw SQL results
type categoryCountRow struct {
	CategoryID uint
	Count      int
}

// GetMainCategoryStats returns post/review/poll counts grouped by main_category_id
func (r *CategoryStatsRepository) GetMainCategoryStats() ([]dto.CategoryCountStat, error) {
	// Get post counts
	postCounts := make(map[uint]int)
	var postRows []categoryCountRow
	r.DB.Model(&entity.Post{}).
		Select("main_category_id as category_id, COUNT(*) as count").
		Where("main_category_id IS NOT NULL").
		Group("main_category_id").
		Scan(&postRows)
	for _, row := range postRows {
		postCounts[row.CategoryID] = row.Count
	}

	// Get review counts
	reviewCounts := make(map[uint]int)
	var reviewRows []categoryCountRow
	r.DB.Model(&entity.Review{}).
		Select("main_category_id as category_id, COUNT(*) as count").
		Where("main_category_id IS NOT NULL").
		Group("main_category_id").
		Scan(&reviewRows)
	for _, row := range reviewRows {
		reviewCounts[row.CategoryID] = row.Count
	}

	// Get poll counts
	pollCounts := make(map[uint]int)
	var pollRows []categoryCountRow
	r.DB.Model(&entity.Poll{}).
		Select("main_category_id as category_id, COUNT(*) as count").
		Where("main_category_id IS NOT NULL").
		Group("main_category_id").
		Scan(&pollRows)
	for _, row := range pollRows {
		pollCounts[row.CategoryID] = row.Count
	}

	// Get all main category IDs
	var mainCategories []entity.MainCategory
	r.DB.Find(&mainCategories)

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

// GetSub1CategoryStats returns post/review/poll counts grouped by sub_category_l1_id
func (r *CategoryStatsRepository) GetSub1CategoryStats() ([]dto.CategoryCountStat, error) {
	// Get post counts
	postCounts := make(map[uint]int)
	var postRows []categoryCountRow
	r.DB.Model(&entity.Post{}).
		Select("sub_category1_id as category_id, COUNT(*) as count").
		Where("sub_category1_id IS NOT NULL").
		Group("sub_category1_id").
		Scan(&postRows)
	for _, row := range postRows {
		postCounts[row.CategoryID] = row.Count
	}

	// Get review counts
	reviewCounts := make(map[uint]int)
	var reviewRows []categoryCountRow
	r.DB.Model(&entity.Review{}).
		Select("sub_category_l1_id as category_id, COUNT(*) as count").
		Where("sub_category_l1_id IS NOT NULL").
		Group("sub_category_l1_id").
		Scan(&reviewRows)
	for _, row := range reviewRows {
		reviewCounts[row.CategoryID] = row.Count
	}

	// Get poll counts
	pollCounts := make(map[uint]int)
	var pollRows []categoryCountRow
	r.DB.Model(&entity.Poll{}).
		Select("sub_category_l1_id as category_id, COUNT(*) as count").
		Where("sub_category_l1_id IS NOT NULL").
		Group("sub_category_l1_id").
		Scan(&pollRows)
	for _, row := range pollRows {
		pollCounts[row.CategoryID] = row.Count
	}

	// Get all sub category L1 IDs
	var subCategories []entity.SubCategoryL1
	r.DB.Find(&subCategories)

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

// GetSub2CategoryStats returns post/review/poll counts grouped by sub_category_l2_id
func (r *CategoryStatsRepository) GetSub2CategoryStats() ([]dto.CategoryCountStat, error) {
	// Get post counts
	postCounts := make(map[uint]int)
	var postRows []categoryCountRow
	r.DB.Model(&entity.Post{}).
		Select("sub_category2_id as category_id, COUNT(*) as count").
		Where("sub_category2_id IS NOT NULL").
		Group("sub_category2_id").
		Scan(&postRows)
	for _, row := range postRows {
		postCounts[row.CategoryID] = row.Count
	}

	// Get review counts
	reviewCounts := make(map[uint]int)
	var reviewRows []categoryCountRow
	r.DB.Model(&entity.Review{}).
		Select("sub_category_l2_id as category_id, COUNT(*) as count").
		Where("sub_category_l2_id IS NOT NULL").
		Group("sub_category_l2_id").
		Scan(&reviewRows)
	for _, row := range reviewRows {
		reviewCounts[row.CategoryID] = row.Count
	}

	// Get poll counts
	pollCounts := make(map[uint]int)
	var pollRows []categoryCountRow
	r.DB.Model(&entity.Poll{}).
		Select("sub_category_l2_id as category_id, COUNT(*) as count").
		Where("sub_category_l2_id IS NOT NULL").
		Group("sub_category_l2_id").
		Scan(&pollRows)
	for _, row := range pollRows {
		pollCounts[row.CategoryID] = row.Count
	}

	// Get all sub category L2 IDs
	var subCategories []entity.SubCategoryL2
	r.DB.Find(&subCategories)

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

// GetAllCategoryStats returns combined stats for all category levels
func (r *CategoryStatsRepository) GetAllCategoryStats() (*dto.CategoryStatsResponse, error) {
	mainStats, err := r.GetMainCategoryStats()
	if err != nil {
		return nil, err
	}

	sub1Stats, err := r.GetSub1CategoryStats()
	if err != nil {
		return nil, err
	}

	sub2Stats, err := r.GetSub2CategoryStats()
	if err != nil {
		return nil, err
	}

	return &dto.CategoryStatsResponse{
		Main: mainStats,
		Sub1: sub1Stats,
		Sub2: sub2Stats,
	}, nil
}
