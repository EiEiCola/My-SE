package dto

// CategoryCountStat represents count statistics for a single category
type CategoryCountStat struct {
	CategoryID  uint `json:"category_id"`
	PostCount   int  `json:"post_count"`
	ReviewCount int  `json:"review_count"`
	PollCount   int  `json:"poll_count"`
}

// CategoryStatsResponse contains statistics for all category levels
type CategoryStatsResponse struct {
	Main []CategoryCountStat `json:"main"`
	Sub1 []CategoryCountStat `json:"sub1"`
	Sub2 []CategoryCountStat `json:"sub2"`
}
