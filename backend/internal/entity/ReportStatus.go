package entity

type ReportStatus struct {
    ID   int    `gorm:"column:id;primaryKey;autoIncrement" json:"id"`
    Name string `gorm:"column:name" json:"name"`

    Reports []Report `gorm:"foreignKey:StatusID;references:ID" json:"reports,omitempty"`
}
