package controller

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/internal/entity" // ⭐ เช็ค Path
	"github.com/sut68/team12/backend/internal/app/services"
	"github.com/sut68/team12/backend/internal/dto"
)

type BlockController struct {
	Service *services.FriendService
}

func NewBlockController(s *services.FriendService) *BlockController {
	return &BlockController{Service: s}
}

// Helper: แปลง Account ID -> Member ID
func (c *BlockController) getMemberID(ctx *gin.Context) (int, error) {
	accountID := ctx.MustGet("user_id").(uint) // Middleware JWT ส่งมาเป็น uint
	var member entity.Member
	if err := c.Service.Repo.DB.Where("member_account_id = ?", accountID).First(&member).Error; err != nil {
		return 0, err
	}
	return int(member.ID), nil
}

// Block: บล็อกผู้ใช้
func (c *BlockController) Block(ctx *gin.Context) {
	var body dto.BlockDTO
	if err := ctx.ShouldBindJSON(&body); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ⭐ แปลง ID ให้ถูกต้อง
	memberID, err := c.getMemberID(ctx)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Member profile not found"})
		return
	}
	body.BlockerID = memberID

	if err := c.Service.Block(body); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusCreated, gin.H{"message": "User blocked"})
}

// Unblock: เลิกบล็อก
func (c *BlockController) Unblock(ctx *gin.Context) {
	targetIDStr := ctx.Param("target_id")
	blockedID, err := strconv.Atoi(targetIDStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid target ID"})
		return
	}

	memberID, err := c.getMemberID(ctx)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Member profile not found"})
		return
	}

	dto := dto.UnblockDTO{
		BlockerID: memberID,
		BlockedID: blockedID,
	}

	if err := c.Service.Unblock(dto); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "User unblocked"})
}

// GetBlockedList: ดูรายชื่อคนที่เราบล็อก (สำหรับ Frontend เอาไปกรอง)
func (c *BlockController) GetBlockedList(ctx *gin.Context) {
	memberID, err := c.getMemberID(ctx)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Member profile not found"})
		return
	}

	users, err := c.Service.GetMyBlockedList(memberID)
	if err != nil {
		// ถ้า Error หรือไม่มีข้อมูล ให้ส่ง array ว่างกลับไป เพื่อไม่ให้หน้าบ้านพัง
		ctx.JSON(http.StatusOK, gin.H{"data": []entity.Member{}})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": users})
}