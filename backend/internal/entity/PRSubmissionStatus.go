package entity

type PRSubmissionStatus struct {
	ID   int    `gorm:"column:id;primaryKey;autoIncrement"`
	Name string `gorm:"column:name"`

	Submissions []PRSubmission `gorm:"foreignKey:StatusID;references:ID"`
}