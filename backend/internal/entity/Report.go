package entity

import (
	"time"

	"github.com/asaskevich/govalidator"
)

type Report struct {
	ID          int       `gorm:"column:report_ID;primaryKey;autoIncrement" json:"id"`
	ReporterID  uint      `gorm:"column:reporter_ID" json:"reporter_id"`
	TargetType  string    `gorm:"column:target_type" json:"target_type" valid:"required~TargetType is required"`
	TargetID    *uint     `gorm:"column:target_id" json:"target_id,omitempty"`
	Title       string    `gorm:"column:title" json:"title" valid:"required~Title is required"`
	Description string    `gorm:"column:description" json:"description" valid:"required~Description is required"`
	StatusID    int       `gorm:"column:status" json:"status_id"`
	AdminID     *uint     `gorm:"column:admin_ID" json:"admin_id,omitempty"`
	CreatedAt   time.Time `gorm:"column:CreatedAt" json:"created_at"`
	UpdatedAt   time.Time `gorm:"column:UpdatedAt" json:"updated_at"`

	Reporter Member        `gorm:"foreignKey:ReporterID;references:ID" json:"reporter,omitempty"`
	Admin    *Admin        `gorm:"foreignKey:AdminID;references:ID" json:"admin,omitempty"`
	Status   ReportStatus  `gorm:"foreignKey:StatusID;references:ID" json:"status,omitempty"`
	Media    []ReportMedia `gorm:"foreignKey:ReportID;references:ID" json:"media,omitempty"`
}

func ValidateReport(r Report) (bool, error) {
	return govalidator.ValidateStruct(r)
}
