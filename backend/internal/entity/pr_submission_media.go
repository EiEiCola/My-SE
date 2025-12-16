package entity

type PRSubmissionMedia struct {
	MediaID int    `gorm:"column:media_ID;primaryKey;autoIncrement" json:"media_id"`
	PRID    int    `gorm:"column:pr_ID" json:"pr_id"`
	URL     string `gorm:"column:url;type:text" json:"url"`
	Type    string `gorm:"column:type" json:"type"`
	IsCover bool   `gorm:"column:is_cover" json:"is_cover"`

	PRSubmission PRSubmission `gorm:"foreignKey:PRID;references:ID"`
}
