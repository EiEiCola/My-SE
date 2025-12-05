package entity

import "gorm.io/gorm"

type ActiveStatus struct {

gorm.Model

ActiveStatusID 	int `json:"active_status_id"`
ActiveStatus 	string `json:"active_status"`

}