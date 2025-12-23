package entity
import "errors"

type ReviewTag struct {
	//gorm.Model
    //ReviewID uint `json:"review_id" gorm:"uniqueIndex:idx_review_tag"`
	//TagID    uint `json:"tag_id"    gorm:"uniqueIndex:idx_review_tag"`
	ReviewID uint `json:"review_id" gorm:"primaryKey"`
	TagID    uint `json:"tag_id"    gorm:"primaryKey"`
}

func ValidateReviewTag(rt ReviewTag) (bool, error) {
	if rt.ReviewID == 0 {
		return false, errors.New("ReviewID is required")
	}
	if rt.TagID == 0 {
		return false, errors.New("TagID is required")
	}
	return true, nil
}