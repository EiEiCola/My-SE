package entity

type FollowStatus struct {
	ID int		 	`gorm:"column:id;primaryKey;autoIncrement" json:"id"`
	Name string 	`gorm:"column:name" json:"name"` // เช่น "Following", "Unfollowed"
}