package entity
 
import
(
	"errors"

)
type ReviewTag struct {
	//gorm.Model
    //ReviewID uint `json:"review_id" gorm:"uniqueIndex:idx_review_tag"`
	//TagID    uint `json:"tag_id"    gorm:"uniqueIndex:idx_review_tag"`
	ReviewID uint `json:"review_id" gorm:"primaryKey"`
	TagID    uint `json:"tag_id"    gorm:"primaryKey"`
}

func (rt *ReviewTag) Validate() error {
	if rt.ReviewID == 0 || rt.TagID == 0 {
		return errors.New("review_id and tag_id are required")
	}
	return nil
}