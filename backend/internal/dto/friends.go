package dto

type SendRequestDTO struct {
    SenderID   int `json:"sender_id"`
    ReceiverID int `json:"receiver_id" binding:"required"`
}

type RespondRequestDTO struct {
    RequestID uint `json:"request_id" binding:"required"` 
    Accept    bool `json:"accept"`
	MemberID  int  `json:"member_id" binding:"required"`
}

type CancelRequestDTO struct {
    RequestID uint `json:"request_id"`
    MemberID  int  `json:"member_id" binding:"required"`
}
type UnfriendDTO struct {
	MemberID   int `json:"member_id"`
	FriendID   int `json:"friend_id" binding:"required"`
}

type BlockDTO struct {
	BlockerID int `json:"blocker_id"`
	BlockedID int `json:"blocked_id" binding:"required"`
}

type UnblockDTO struct {
	BlockerID int `json:"blocker_id"`
	BlockedID int `json:"blocked_id" binding:"required"`
}

type FollowDTO struct {
	FollowerID int `json:"follower_id"`
	FollowedID int `json:"followed_id" binding:"required"`
}

// UnfollowDTO สำหรับเลิกติดตาม
type UnfollowDTO struct {
	FollowerID int `json:"follower_id"`
	FollowedID int `json:"followed_id" binding:"required"`
}

// MuteDTO สำหรับซ่อนโพสต์ของคนที่เรากำลังติดตามอยู่
type MuteDTO struct {
	FollowerID int `json:"follower_id"`
	FollowedID int `json:"followed_id" binding:"required"`
}

// UnmuteDTO สำหรับยกเลิกการ Mute (กลับมาเห็นโพสต์)
type UnmuteDTO struct {
	FollowerID int `json:"follower_id"`
	FollowedID int `json:"followed_id" binding:"required"`
}