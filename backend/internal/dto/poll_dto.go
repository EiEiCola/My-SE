package dto

import "time"

/* =========================
   CREATE POLL (MEMBER)
========================= */

type CreatePollOptionDTO struct {
	Label     string `json:"label" binding:"required"`
	ImgURL    string `json:"img_url"`              // รูปของตัวเลือก
	SortOrder *int   `json:"sort_order,omitempty"` // optional
}

type CreatePollRequest struct {
	Question      string     `json:"question" binding:"required"`
	AllowMultiple bool       `json:"allow_multiple"`
	MaxChoice     *int       `json:"max_choice"`
	StartAt       *time.Time `json:"start_at"`
	EndAt         *time.Time `json:"end_at"`

	MainCategoryID  *uint `json:"main_category_id"`
	SubCategoryL1ID *uint `json:"sub_category_l1_id"`
	SubCategoryL2ID *uint `json:"sub_category_l2_id"`

	IsAnonymous bool `json:"is_anonymous"`

	Options []CreatePollOptionDTO `json:"options" binding:"required,min=2,dive"`
}

// สำหรับอัปเดตโพล (DRAFT หรือ REJECTED เท่านั้น)
type UpdatePollRequest struct {
	Question      string     `json:"question" binding:"required"`
	AllowMultiple bool       `json:"allow_multiple"`
	MaxChoice     *int       `json:"max_choice"`
	StartAt       *time.Time `json:"start_at"`
	EndAt         *time.Time `json:"end_at"`

	MainCategoryID  *uint `json:"main_category_id"`
	SubCategoryL1ID *uint `json:"sub_category_l1_id"`
	SubCategoryL2ID *uint `json:"sub_category_l2_id"`
	IsAnonymous bool `json:"is_anonymous"`

	Options []CreatePollOptionDTO `json:"options" binding:"required,min=2,dive"`
}

/* =========================
   LIST / DETAIL RESPONSE
========================= */

type PollOptionResponse struct {
	ID        uint   `json:"id"`
	Label     string `json:"label"`
	ImgURL    string `json:"img_url"`
	SortOrder int    `json:"sort_order"`

	VoteCount int64 `json:"vote_count,omitempty"`
	Percent   float64 `json:"percent,omitempty"`
}

type CategoryBrief struct {
	ID    uint   `json:"id"`
	Title string `json:"title"`
}

type PollResponse struct {
	ID       uint   `json:"id"`
	Question string `json:"question"`
	StatusID uint `json:"poll_status_id"`
	MemberID uint `json:"member_id"`
	AuthorName string `json:"author_name,omitempty"`
	AllowMultiple bool       `json:"allow_multiple"`
	MaxChoice     *int       `json:"max_choice"`
	StartAt       *time.Time `json:"start_at"`
	EndAt         *time.Time `json:"end_at"`

	
  	MainCategoryID  *uint `json:"main_category_id,omitempty"`
 	SubCategoryL1ID *uint `json:"sub_category_l1_id,omitempty"`
  	SubCategoryL2ID *uint `json:"sub_category_l2_id,omitempty"`

		// ✅ category objects (ใหม่) — ตัวนี้แหละที่ PollDetail จะใช้โชว์สวย ๆ
	MainCategory  *CategoryBrief `json:"main_category,omitempty"`
	SubCategoryL1 *CategoryBrief `json:"sub_category_l1,omitempty"`
	SubCategoryL2 *CategoryBrief `json:"sub_category_l2,omitempty"`

	PublishedAt      *time.Time `json:"published_at,omitempty"` //“เผยแพร่จริง” ตอนแอดมินกด Approve/Publish
    EffectiveStartAt *time.Time `json:"effective_start_at,omitempty"` // เวลาเริ่มโหวตที่แท้จริง (หลังจาก publish) แบบstart_at=10:10, published_at=10:20 → effective_start_at=10:20
    ComputedStatus   string     `json:"computed_status"` // "UPCOMING" | "OPEN" | "CLOSED" คือสถานะที่ backend คำนวณให้จากเวลา (ไม่ใช่ status ในdb)


	LastRejectReason string `json:"last_reject_reason,omitempty"`

	Options   []PollOptionResponse `json:"options"`
	CreatedAt time.Time            `json:"created_at"`
	
	StatusName string `json:"status_name"`

	HasVoted    bool   `json:"has_voted"`
 	MyOptionIDs []uint `json:"my_option_ids"`

	TotalVoters *int64 `json:"total_voters,omitempty"` // ✅ จำนวน "คน" ที่โหวต (COUNT poll_votes)
	IsAnonymous bool `json:"is_anonymous"`
	AuthorUsername string `json:"author_username,omitempty"`
		



	
}

// สำหรับรายการโพลของสมาชิก (My Polls)
type MyPollsResponse struct {
	ID               uint       `json:"id"`
	Question         string     `json:"question"`
	StatusID         uint       `json:"status_id"`
	StatusName       string     `json:"status_name"`
	LastRejectReason string     `json:"last_reject_reason,omitempty"`
	CreatedAt        time.Time  `json:"created_at"`
	StartAt          *time.Time `json:"start_at"`
	EndAt            *time.Time `json:"end_at"`
	MainCategoryID  *uint `json:"main_category_id,omitempty"`
	SubCategoryL1ID *uint `json:"sub_category_l1_id,omitempty"`
	SubCategoryL2ID *uint `json:"sub_category_l2_id,omitempty"`


	
}

/* =========================
   VOTE
========================= */

type VotePollRequest struct {
	OptionIDs []uint `json:"option_ids" binding:"required,min=1,dive,gt=0"`
}

type VotePollResponse struct {
	PollID    uint   `json:"poll_id"`
	MemberID  uint   `json:"member_id"`
	OptionIDs []uint `json:"option_ids"`
	Message   string `json:"message"`

	Results *PollResultsResponse `json:"results,omitempty"`
}

/* =========================
   ADMIN ACTION
========================= */

type RejectPollRequest struct {
	Reason string `json:"reason" binding:"required"`
}

/* =========================
   RESULTS
========================= */

type PollResultItem struct {
	OptionID uint    `json:"option_id"`
	Label    string  `json:"label"`
	ImgURL   string  `json:"img_url"`
	Count    int64   `json:"count"`
	Percent  float64 `json:"percent"`
}

type PollResultsResponse struct {
	PollID   uint             `json:"poll_id"`
	Question string           `json:"question"`
	Total    int64            `json:"total_votes"`
	Items    []PollResultItem `json:"items"`
}

type MyVoteResponse struct {
	HasVoted  bool   `json:"has_voted"`
	OptionIDs []uint `json:"option_ids"`
}
