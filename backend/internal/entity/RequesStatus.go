package entity

type RequesStatus struct {
	ID		int     `gorm:"column:id;primaryKey;autoIncrement" json:"id"`
	Name 	string 	`gorm:"column:name" json:"name"`

}
