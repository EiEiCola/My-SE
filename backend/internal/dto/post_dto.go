package dto
// ใช้ตอนสร้างโพสต์ใหม่
type CreatePostRequest struct {
	Title	    string `json:"title" binding:"required,min=3"`
	Content     string `json:"content" binding:"required,min=5"`
	IsAnonymous bool   `json:"is_anonymous"`

	MainCategoryID *uint `json:"main_category_id"`
	SubCategory1ID *uint `json:"sub_category1_id"`
	SubCategory2ID *uint `json:"sub_category2_id"`
}
// ใช้ตอนอัปเดตโพสต์
// ใช้ pointer เพื่อให้ส่งเฉพาะฟิลด์ที่ต้องการอัปเดตได้
type UpdatePostRequest struct {
	Title		*string `json:"title" binding:"omitempty,min=3"`
	Content	 	*string `json:"content" binding:"omitempty,min=5"`
	IsAnonymous *bool   `json:"is_anonymous" binding:"omitempty"`

	MainCategoryID *uint `json:"main_category_id"`
	SubCategory1ID *uint `json:"sub_category1_id"`
	SubCategory2ID *uint `json:"sub_category2_id"`

}