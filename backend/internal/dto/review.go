package dto
// 1) CREATE REVIEW REQUEST DTO

type CreateReviewRequest struct {
    Title       string `json:"title" binding:"required"`
    Content     string `json:"content" binding:"required"`
    Rating      int    `json:"rating" binding:"required,min=1,max=5"`
    IsAnonymous bool   `json:"is_anonymous"`

    // หมวดหมู่ที่รีวิวจะผูกอยู่
    MainCategoryID  *uint `json:"main_category_id" binding:"required"`
    SubCategoryL1ID *uint `json:"sub_category_l1_id"`
    SubCategoryL2ID *uint `json:"sub_category_l2_id"`

    // User ควรมาจาก token แต่ถ้า controller ยังไม่ทำ auth ให้ส่งมาก่อน
    MemberID uint `json:"member_id" binding:"required"`

    // #tags (แบบ Twitter)
    // ถ้า tag มีอยู่แล้ว → ผูกกับ review
    // ถ้าไม่มี → service จะสร้างใหม่
	//DTO = อินพุตของผู้ใช้ เดี๋ยว service จะไปแมปกับ entity อีกที
    Hashtags []string `json:"hashtags"`

    // สำหรับอัปโหลดรูปภาพ พร้อมลำดับ
    Images []ReviewImageRequest `json:"images"`
}

// DTO สำหรับรูปภาพหนึ่งรูป
type ReviewImageRequest struct {
    URL       string `json:"url"`        // ไม่ required เพื่อให้ optional
    IsCover   bool   `json:"is_cover"`
    SortOrder int    `json:"sort_order"`
}


// ------------------------------
// 2) VOTE REVIEW REQUEST DTO
// ------------------------------

type VoteReviewRequest struct {
    VoteType string `json:"vote_type" binding:"required,oneof=helpful not_helpful"`
    MemberID uint   `json:"member_id" binding:"required"`
}


// ------------------------------
// 3) REVIEW RESPONSE DTO (ส่งกลับ UI)
// ------------------------------

type ReviewResponse struct {
    ID        uint   `json:"id"`
    Title     string `json:"title"`
    Content   string `json:"content"`
    Rating    int    `json:"rating"`
    IsAnonymous bool `json:"is_anonymous"`

    HelpfulCount    int `json:"helpful_count"`
    NotHelpfulCount int `json:"not_helpful_count"`

    MemberName string `json:"member_name"`    // ถ้า anonymous UI จะโชว์ "ผู้ใช้ไม่ระบุตัวตน"
    MemberID   uint   `json:"member_id"`

    MainCategoryID  *uint `json:"main_category_id"`
    SubCategoryL1ID *uint `json:"sub_category_l1_id"`
    SubCategoryL2ID *uint `json:"sub_category_l2_id"`

    Tags   []string            `json:"tags"`   // ชื่อแท็ก เช่น ["งานเยอะ","เก็บคะแนนโหด"]
    Images []ReviewImageOutput `json:"images"`

    CreatedAt string `json:"created_at"`
}

// สำหรับ response image ทีละรูป
type ReviewImageOutput struct {
    URL       string `json:"url"`
    IsCover   bool   `json:"is_cover"`
    SortOrder int    `json:"sort_order"`
}
