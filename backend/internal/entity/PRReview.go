package entity
import "time"

type PRReview struct {
	ID          int       `gorm:"column:rv_ID;primaryKey;autoIncrement"`
	PRID        int       `gorm:"column:pr_ID"`
	AdminID     int       `gorm:"column:admin_ID"` // ให้ตรงกับ Admin.ID (admin_id)
	Description string    `gorm:"column:description"`
	Comment     string    `gorm:"column:comment"`
	CreatedAt   time.Time `gorm:"column:CreatedAt"`

	PRSubmission PRSubmission `gorm:"foreignKey:PRID;references:ID"`
	Admin        Admin        `gorm:"foreignKey:AdminID;references:ID"`
}