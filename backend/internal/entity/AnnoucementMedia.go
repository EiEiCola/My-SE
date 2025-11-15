package entity

type AnnouncementMedia struct {
	MediaID        int    `gorm:"column:media_ID;primaryKey;autoIncrement"`
	AnnouncementID int    `gorm:"column:ann_ID"`
	Image          string `gorm:"column:image"`
	URL            string `gorm:"column:url"`
	IsCover        bool   `gorm:"column:is_cover"`

	Announcement Announcement `gorm:"foreignKey:AnnouncementID;references:ID"`
}