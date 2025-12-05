package entity

type ReportMedia struct {
    MediaID   int    `gorm:"column:media_ID;primaryKey;autoIncrement" json:"media_id"`
    ReportID  int    `gorm:"column:report_ID" json:"report_id"`
    URL       string `gorm:"column:url" json:"url"`
    Type      string `gorm:"column:type" json:"type"`
    IsAttachment bool `gorm:"column:is_attachment" json:"is_attachment"`

    Report Report `gorm:"foreignKey:ReportID;references:ID" json:"report,omitempty"`
}
