package entity

type AnnouncementStatus struct {
	ID   int    `gorm:"column:id;primaryKey;autoIncrement"`
	Name string `gorm:"column:name"`

	Announcements []Announcement `gorm:"foreignKey:StatusID;references:ID"`
}