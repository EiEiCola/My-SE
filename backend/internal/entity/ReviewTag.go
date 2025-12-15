package entity

type ReviewTag struct {
	//gorm.Model
    //ReviewID uint `json:"review_id" gorm:"uniqueIndex:idx_review_tag"`
	//TagID    uint `json:"tag_id"    gorm:"uniqueIndex:idx_review_tag"`
	ReviewID uint `json:"review_id" gorm:"primaryKey"`
	TagID    uint `json:"tag_id"    gorm:"primaryKey"`
}
