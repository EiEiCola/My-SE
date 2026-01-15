package controller

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/internal/app/services"
	"github.com/sut68/team12/backend/internal/dto"
	"github.com/sut68/team12/backend/internal/entity" // ⭐ เช็ค Path
)

type FriendshipController struct {
	Service *services.FriendService
}

func NewFriendshipController(s *services.FriendService) *FriendshipController {
	return &FriendshipController{Service: s}
}

// Helper: แปลง Account ID -> Member ID
func (c *FriendshipController) getMemberID(ctx *gin.Context) (int, error) {
	accountID := ctx.MustGet("user_id").(uint)
	var member entity.Member
	if err := c.Service.Repo.DB.Where("member_account_id = ?", accountID).First(&member).Error; err != nil {
		return 0, err
	}
	return int(member.ID), nil
}

// Unfriend: เลิกเป็นเพื่อน
func (c *FriendshipController) Unfriend(ctx *gin.Context) {
	targetIDStr := ctx.Param("target_id")
	friendID, err := strconv.Atoi(targetIDStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid friend ID"})
		return
	}

	memberID, err := c.getMemberID(ctx)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Member profile not found"})
		return
	}

	dto := dto.UnfriendDTO{
		MemberID: memberID,
		FriendID: friendID,
	}

	if err := c.Service.Unfriend(dto); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "Unfriended successfully"})
}

// GetMyFriends: ดึงรายชื่อเพื่อน
func (c *FriendshipController) GetMyFriends(ctx *gin.Context) {
	memberID, err := c.getMemberID(ctx)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Member profile not found"})
		return
	}

	friends, err := c.Service.Repo.GetFriendsForUser(memberID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"data": friends})
}

// GetMyFollowers: ดูคนที่มาติดตามเรา
func (c *FriendshipController) GetMyFollowers(ctx *gin.Context) {
	memberID, err := c.getMemberID(ctx)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Member profile not found"})
		return
	}

	followers, err := c.Service.Repo.GetFollowers(memberID)
	if err != nil {
		// ถ้าไม่มีข้อมูล ให้ส่ง array ว่างกลับไป
		ctx.JSON(http.StatusOK, gin.H{"data": []entity.Member{}})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"data": followers})
}

// GetMyFollowing: ดูคนที่เราไปติดตามเขา (ใช้สำหรับ Frontend เช็คปุ่ม Follow/Unfollow)
func (c *FriendshipController) GetMyFollowing(ctx *gin.Context) {
	memberID, err := c.getMemberID(ctx)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Member profile not found"})
		return
	}

	following, err := c.Service.Repo.GetFollowing(memberID)
	if err != nil {
		ctx.JSON(http.StatusOK, gin.H{"data": []entity.Member{}})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"data": following})
}

// GetPopularMembers: เพื่อนยอดนิยม
func (c *FriendshipController) GetPopularMembers(ctx *gin.Context) {
	// 1. ดึง ID เราจาก Token (ถ้าไม่มี Token อาจจะให้เป็น 0 เพื่อโชว์แบบ Public)
	var myID int
	if _, exists := ctx.Get("user_id"); exists {
		// ต้องหา MemberID จริงจาก AccountID ก่อน (ใช้ Helper Function เดิม)
		memberID, err := c.getMemberID(ctx)
		if err == nil {
			myID = memberID
		}
	}

	// 2. ส่ง myID ไป Service
	members, err := c.Service.GetPopularMembers(myID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"data": members})
}

// GetAllMembers: สมาชิกทั้งหมด (Search)
func (c *FriendshipController) GetAllMembers(ctx *gin.Context) {
	var myID int
	if _, exists := ctx.Get("user_id"); exists {
		memberID, err := c.getMemberID(ctx)
		if err == nil {
			myID = memberID
		}
	}

	members, err := c.Service.GetAllMembers(myID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"data": members})
}