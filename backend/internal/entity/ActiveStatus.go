package entity

import "gorm.io/gorm"

type ActiveStatus struct {

gorm.Model

ActiveStatus string `json:"active_status"`

}