package entity

type PRSubmissionMedia struct {
	MediaID int    `gorm:"column:media_ID;primaryKey;autoIncrement"`
	PRID    int    `gorm:"column:pr_ID"`
	URL     string `gorm:"column:url"`
	Type    string `gorm:"column:type"`
	IsCover bool   `gorm:"column:is_cover"`

	PRSubmission PRSubmission `gorm:"foreignKey:PRID;references:ID"`
}