package dto

import "time"

type MyStickerDTO struct {
	ID                    uint      `json:"id"`
	MemberID              uint      `json:"member_id"`
	RewardID              uint      `json:"reward_id"`
	RedeemedAt            time.Time `json:"redeemed_at"`

	RewardNameSnapshot    string `json:"reward_name_snapshot"`
	PointRequiredSnapshot int    `json:"point_required_snapshot"`

	RewardName    string `json:"reward_name"`
	RewardPicture string `json:"reward_picture"`
	PointRequired int    `json:"point_required"`
}
