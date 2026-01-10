package dto

import "time"

type AdminReviewListItem struct {
	ID                uint       `json:"id"`
	Title             string     `json:"title"`
	Content           string     `json:"content"`
	Rating            int        `json:"rating"`
	IsAnonymous       bool       `json:"is_anonymous"`
	HelpfulCount      int        `json:"helpful_count"`
	NotHelpfulCount   int        `json:"not_helpful_count"`
	CreatedAt         time.Time  `json:"created_at"`
	DeletedAt         *time.Time `json:"deleted_at,omitempty"`
	AdminDeleteReason string     `json:"admin_delete_reason,omitempty"`
	DeletedByType     string     `json:"deleted_by_type"`

	Member struct {
		Username      string `json:"username"`
		MemberPicture string `json:"member_picture"`
	} `json:"member"`

	MainCategory *struct {
		Title string `json:"title"`
	} `json:"main_category,omitempty"`

	SubCategoryL1 *struct {
		Title string `json:"title"`
	} `json:"sub_category_l1,omitempty"`

	SubCategoryL2 *struct {
		Title string `json:"title"`
	} `json:"sub_category_l2,omitempty"`

	Tags []struct {
		Name string `json:"name"`
	} `json:"tags,omitempty"`

	ReportCount int `json:"report_count"`

	ReviewImages []struct {
		URL string `json:"url"`
	} `json:"review_images,omitempty"`
}
