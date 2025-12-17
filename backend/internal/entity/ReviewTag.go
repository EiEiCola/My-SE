package entity


type ReviewTag struct {
	ReviewID uint `json:"review_id" gorm:"primaryKey"`
    TagID    uint `json:"tag_id"    gorm:"primaryKey"`
}
