package entity

import "gorm.io/gorm"

type PointRule struct {

gorm.Model

PointRuleID			int	   `json:"point_rule"`
ActivityType 		string `json:"activity_type"`
ActivityPoint 		string `json:"activity_point"`
DailyLimit			string `json:"daily_limit"`

}