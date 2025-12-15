package repository

import (
	"github.com/sut68/team12/backend/internal/entity"
	"gorm.io/gorm"
)

// -------- MainCategory --------

type MainCategoryRepository struct {
	DB *gorm.DB
}

func NewMainCategoryRepository(db *gorm.DB) *MainCategoryRepository {
	return &MainCategoryRepository{DB: db}
}

func (r *MainCategoryRepository) FindAll() ([]entity.MainCategory, error) {
	var items []entity.MainCategory
	err := r.DB.Order("order_index ASC").Find(&items).Error
	return items, err
}

func (r *MainCategoryRepository) FindByID(id uint) (*entity.MainCategory, error) {
	var item entity.MainCategory
	err := r.DB.
		Preload("SubCategoriesL1").
		Preload("Posts").
		Preload("Reviews").
		Preload("Polls").
		First(&item, id).Error
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *MainCategoryRepository) Create(m *entity.MainCategory) error {
	return r.DB.Create(m).Error
}

func (r *MainCategoryRepository) Update(m *entity.MainCategory) error {
	return r.DB.Save(m).Error
}

func (r *MainCategoryRepository) Delete(id uint) error {
	return r.DB.Delete(&entity.MainCategory{}, id).Error
}

// -------- SubCategoryL1 --------

type SubCategoryL1Repository struct {
	DB *gorm.DB
}

func NewSubCategoryL1Repository(db *gorm.DB) *SubCategoryL1Repository {
	return &SubCategoryL1Repository{DB: db}
}

// mainID == nil => ดึงทุกตัว
func (r *SubCategoryL1Repository) FindAll(mainID *uint) ([]entity.SubCategoryL1, error) {
	var items []entity.SubCategoryL1
	db := r.DB.Model(&entity.SubCategoryL1{})

	if mainID != nil {
		db = db.Where("main_category_id = ?", *mainID)
	}

	err := db.Order("order_index ASC").Find(&items).Error
	return items, err
}

func (r *SubCategoryL1Repository) FindByID(id uint) (*entity.SubCategoryL1, error) {
	var item entity.SubCategoryL1
	err := r.DB.
		Preload("SubCategories").  //จริงๆต้องใช้ SubCategoriesL2 แต่ ใน entity ใช้ SubCategories เลยต้องไปแก้ไขใน entity ก่อน
		Preload("Posts").
		Preload("Reviews").
		Preload("Polls").
	    First(&item, id).Error
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *SubCategoryL1Repository) Create(m *entity.SubCategoryL1) error {
	return r.DB.Create(m).Error
}

func (r *SubCategoryL1Repository) Update(m *entity.SubCategoryL1) error {
	return r.DB.Save(m).Error
}

func (r *SubCategoryL1Repository) Delete(id uint) error {
	return r.DB.Delete(&entity.SubCategoryL1{}, id).Error
}

// -------- SubCategoryL2 --------

type SubCategoryL2Repository struct {
	DB *gorm.DB
}

func NewSubCategoryL2Repository(db *gorm.DB) *SubCategoryL2Repository {
	return &SubCategoryL2Repository{DB: db}
}

// sub1ID == nil => ดึงทุกตัว
func (r *SubCategoryL2Repository) FindAll(sub1ID *uint) ([]entity.SubCategoryL2, error) {
	var items []entity.SubCategoryL2
	db := r.DB.Model(&entity.SubCategoryL2{})

	if sub1ID != nil {
		db = db.Where("sub_category_l1_id = ?", *sub1ID)
	}

	err := db.Order("order_index ASC").Find(&items).Error
	return items, err
}

func (r *SubCategoryL2Repository) FindByID(id uint) (*entity.SubCategoryL2, error) {
	var item entity.SubCategoryL2
	err := r.DB.
		Preload("Posts").
		Preload("Reviews").
		Preload("Polls").
		First(&item, id).Error
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *SubCategoryL2Repository) Create(m *entity.SubCategoryL2) error {
	return r.DB.Create(m).Error
}

func (r *SubCategoryL2Repository) Update(m *entity.SubCategoryL2) error {
	return r.DB.Save(m).Error
}

func (r *SubCategoryL2Repository) Delete(id uint) error {
	return r.DB.Delete(&entity.SubCategoryL2{}, id).Error
}
