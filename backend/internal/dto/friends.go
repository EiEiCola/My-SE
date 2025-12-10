package dto

type SendRequestDTO struct {
	SenderID  int `json:"sender_id" binding:"required"`
	ReceiverID int `json:"receiver_id" binding:"required"`
}

type RespondRequestDTO struct {
	RequestID int  `json:"request_id" binding:"required"`
	Accept    bool `json:"accept"`
}

type CancelRequestDTO struct {
	RequestID int `json:"request_id" binding:"required"`
	MemberID  int `json:"member_id" binding:"required"`
}

type UnfriendDTO struct {
	MemberID   int `json:"member_id" binding:"required"`
	FriendID   int `json:"friend_id" binding:"required"`
}


type BlockDTO struct {
	BlockerID int `json:"blocker_id" binding:"required"`
	BlockedID int `json:"blocked_id" binding:"required"`
}