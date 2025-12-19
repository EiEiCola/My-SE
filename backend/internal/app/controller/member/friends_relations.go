package controller

import (
	"github.com/sut68/team12/backend/internal/app/services"
	"github.com/sut68/team12/backend/internal/dto"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type FriendshipController struct {
	Service *services.FriendService
}

func NewFriendshipController(s *services.FriendService) *FriendshipController {
	return &FriendshipController{Service: s}
}

func (ctl *FriendshipController) Unfriend(c *gin.Context) {
	var body dto.UnfriendDTO
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": ctl.Service.Unfriend(body)})
}

// GetAllMembers เรียกดูสมาชิกทั้งหมดในระบบ
func (ctl *FriendshipController) GetAllMembers(c *gin.Context) {
	members, err := ctl.Service.Repo.GetAllMembers()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงข้อมูลสมาชิกได้"})
		return
	}
	c.JSON(http.StatusOK, members)
}

// GetMyFollowers เรียกดูคนที่มาติดตามเรา
func (ctl *FriendshipController) GetMyFollowers(c *gin.Context) {
	memberID := 1
	followers, err := ctl.Service.Repo.GetFollowers(memberID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, followers)
}

// GetMyFollowing เรียกดูคนที่เราไปติดตามเขา
func (ctl *FriendshipController) GetMyFollowing(c *gin.Context) {
	memberID := 1
	following, err := ctl.Service.Repo.GetFollowing(memberID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, following)
}

// เรียกดูเพื่อนของฉัน
func (ctl *FriendshipController) GetMyFriends(c *gin.Context) {
	// ในขั้นตอนนี้รับ ID ผ่าน Query/Param ไปก่อน (เช่น /api/my/friends?id=1)
	// เมื่อทำระบบ Login เสร็จค่อยดึงจาก Token
	userIDStr := c.Query("id")
	userID, _ := strconv.Atoi(userIDStr)

	friends, err := ctl.Service.Repo.GetFriends(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, friends)
}
