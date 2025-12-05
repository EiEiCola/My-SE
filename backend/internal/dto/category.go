package dto

// -------- MainCategory --------

type CreateMainCategoryRequest struct {
	Title       string `json:"title" binding:"required,min=3,max=100"`
	Description string `json:"description" binding:"max=255"`
	Icon        string `json:"icon" binding:"max=100"`
	OrderIndex  int    `json:"order_index"`
}

type UpdateMainCategoryRequest struct {
	Title       *string `json:"title" binding:"omitempty,min=3,max=100"`
	Description *string `json:"description" binding:"omitempty,max=255"`
	Icon        *string `json:"icon" binding:"omitempty,max=100"`
	OrderIndex  *int    `json:"order_index" binding:"omitempty"`
}

// -------- SubCategoryL1 --------

type CreateSubCategoryL1Request struct {
	Title          string `json:"title" binding:"required,min=3,max=100"`
	Description    string `json:"description" binding:"max=255"`
	OrderIndex     int    `json:"order_index"`
	MainCategoryID uint   `json:"main_category_id" binding:"required"`
}

type UpdateSubCategoryL1Request struct {
	Title       *string `json:"title" binding:"omitempty,min=3,max=100"`
	Description *string `json:"description" binding:"omitempty,max=255"`
	OrderIndex  *int    `json:"order_index" binding:"omitempty"`
}

// -------- SubCategoryL2 --------

type CreateSubCategoryL2Request struct {
	Title           string `json:"title" binding:"required,min=3,max=100"`
	Description     string `json:"description" binding:"max=255"`
	OrderIndex      int    `json:"order_index"`
	SubCategoryL1ID uint   `json:"sub_category_l1_id" binding:"required"`
}

type UpdateSubCategoryL2Request struct {
	Title       *string `json:"title" binding:"omitempty,min=3,max=100"`
	Description *string `json:"description" binding:"omitempty,max=255"`
	OrderIndex  *int    `json:"order_index" binding:"omitempty"`
}
