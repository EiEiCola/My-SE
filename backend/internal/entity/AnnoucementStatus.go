package entity

type AnnouncementStatus struct {
	ID   int    `gorm:"column:id;primaryKey;autoIncrement" json:"id"`
	Name string `gorm:"column:name" json:"name"`

	Announcements []Announcement `gorm:"foreignKey:StatusID;references:ID" json:"announcements,omitempty"`
}
