package entity

import "time"

type PRReview struct {
	ID          int       `gorm:"column:rv_id;primaryKey;autoIncrement"`
	PRID        int       `gorm:"column:pr_id"`
	AdminID     int       `gorm:"column:admin_id"`
	Description string    `gorm:"column:description"`
	Comment     string    `gorm:"column:comment"`
	CreatedAt   time.Time `gorm:"column:created_at"`

	PRSubmission PRSubmission `gorm:"foreignKey:PRID;references:ID;constraint:false"`
	Admin        Admin        `gorm:"foreignKey:AdminID;references:ID;constraint:false"`
}
