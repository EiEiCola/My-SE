package dto

// -------- MainCategory --------

type CreateMainCategoryRequest struct {
	Title       string `json:"title" binding:"required,min=2,max=60"`
	Description string `json:"description" binding:"required,min=1,max=300"`
	Icon        string `json:"icon" binding:"required"`
	OrderIndex  int    `json:"order_index" binding:"min=0,max=200"`
}

type UpdateMainCategoryRequest struct {
	Title       *string `json:"title" binding:"omitempty,min=2,max=60"`
	Description *string `json:"description" binding:"omitempty,min=1,max=300"`
	Icon        *string `json:"icon" binding:"omitempty"`
	OrderIndex  *int    `json:"order_index" binding:"omitempty,min=0,max=200"`
}

// -------- SubCategoryL1 --------

type CreateSubCategoryL1Request struct {
	Title          string `json:"title" binding:"required,min=2,max=60"`
	Description    string `json:"description" binding:"required,min=1,max=300"`
	OrderIndex     int    `json:"order_index" binding:"min=0,max=100"`
	MainCategoryID uint   `json:"main_category_id" binding:"required"`
}

type UpdateSubCategoryL1Request struct {
	Title       *string `json:"title" binding:"omitempty,min=2,max=60"`
	Description *string `json:"description" binding:"omitempty,min=1,max=300"`
	OrderIndex  *int    `json:"order_index" binding:"omitempty,min=0,max=100"`
}

// -------- SubCategoryL2 --------

type CreateSubCategoryL2Request struct {
	Title           string `json:"title" binding:"required,min=2,max=60"`
	Description     string `json:"description" binding:"required,min=1,max=300"`
	OrderIndex      int    `json:"order_index" binding:"min=0,max=100"`
	SubCategoryL1ID uint   `json:"sub_category_l1_id" binding:"required"`
}

type UpdateSubCategoryL2Request struct {
	Title       *string `json:"title" binding:"omitempty,min=2,max=60"`
	Description *string `json:"description" binding:"omitempty,min=1,max=300"`
	OrderIndex  *int    `json:"order_index" binding:"omitempty,min=0,max=100"`
}
