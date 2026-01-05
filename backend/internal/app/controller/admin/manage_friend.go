package controller

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/internal/app/services"
)

type AdminFriendController struct {
	Service *services.FriendService
}

func NewAdminFriendController(s *services.FriendService) *AdminFriendController {
	return &AdminFriendController{Service: s}
}

// AdminGetAllLogs ดูประวัติทั้งหมด (รวมที่ Cancel/Reject/Inactive)
func (ctl *AdminFriendController) AdminGetAllLogs(c *gin.Context) {
	relations, err := ctl.Service.Repo.AdminGetAllRelations()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, relations)
}
// Get All Requests
func (ctl *AdminFriendController) AdminGetAllRequests(c *gin.Context) {
    reqs, err := ctl.Service.Repo.AdminGetAllRequests()
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusOK, reqs)
}

// Get All Blocks
func (ctl *AdminFriendController) AdminGetAllBlocks(c *gin.Context) {
    blocks, err := ctl.Service.Repo.AdminGetAllBlocks()
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusOK, blocks)
}

// 1. ลบ Request
func (ctl *AdminFriendController) AdminDeleteRequest(c *gin.Context) {
    // รับจาก URL Param: /friend-requests/:id
    idStr := c.Param("id")
    id, _ := strconv.Atoi(idStr)

    if err := ctl.Service.Repo.DeleteRequest(id); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Delete failed"})
        return
    }
    c.JSON(http.StatusOK, gin.H{"message": "Deleted successfully"})
}

// 2. ลบ Relation
func (ctl *AdminFriendController) AdminDeleteRelation(c *gin.Context) {
    // รับจาก Query: ?m1=1&m2=2
    m1, _ := strconv.Atoi(c.Query("m1"))
    m2, _ := strconv.Atoi(c.Query("m2"))

    if err := ctl.Service.Repo.DeleteRelation(m1, m2); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Delete failed"})
        return
    }
    c.JSON(http.StatusOK, gin.H{"message": "Deleted successfully"})
}

// 3. ลบ Block
func (ctl *AdminFriendController) AdminDeleteBlock(c *gin.Context) {
    // รับจาก Query: ?blocker_id=1&blocked_id=2
    blockerID, _ := strconv.Atoi(c.Query("blocker_id"))
    blockedID, _ := strconv.Atoi(c.Query("blocked_id"))

    if err := ctl.Service.Repo.DeleteBlock(blockerID, blockedID); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Delete failed"})
        return
    }
    c.JSON(http.StatusOK, gin.H{"message": "Deleted successfully"})
}