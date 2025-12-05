package entity

type AnnouncementMedia struct {
	MediaID        int    `gorm:"column:media_ID;primaryKey;autoIncrement" json:"media_id"`
	AnnouncementID int    `gorm:"column:ann_ID" json:"announcement_id"`
	Image          string `gorm:"column:image" json:"image"`
	URL            string `gorm:"column:url" json:"url"`
	IsCover        bool   `gorm:"column:is_cover" json:"is_cover"`

	Announcement Announcement `gorm:"foreignKey:AnnouncementID;references:ID" json:"announcement,omitempty"`
}
