package controller

import (

    "net/http"
    "strconv"

    "github.com/sut68/team12/backend/internal/app/services"
    "github.com/gin-gonic/gin"
)

// controller สำหรับ endpoint ที่เกี่ยวกับ ActiveStatus (สถานะการใช้งาน)
type ActiveStatusController struct {
    activeStatusService services.ActiveStatusService
}

// register route ของ ActiveStatus กับ Gin engine
func NewActiveStatusController(r *gin.Engine, activeStatusService services.ActiveStatusService) {
    ctl := &ActiveStatusController{activeStatusService: activeStatusService}

    // group path พื้นฐานของ ActiveStatus
    activeStatus := r.Group("/api/active-statuses")
    {
        // GET /api/active-statuses → ดึง list ทั้งหมด
        activeStatus.GET("", ctl.GetAll)

        // GET /api/active-statuses/:id → ดึงตาม id
        activeStatus.GET("/:id", ctl.GetByID)
    }
}

// struct สำหรับแมปข้อมูลก่อนส่งออกไปหน้า frontend
type activeStatusResponse struct {
    ID   uint   `json:"id"`
    Name string `json:"name"`
}

// handler สำหรับ GET /api/active-statuses
// ดึง ActiveStatus ทั้งหมดแล้วแปลงเป็น response แบบง่าย ๆ
func (ctl *ActiveStatusController) GetAll(c *gin.Context) {
    statuses, err := ctl.activeStatusService.GetAllStatuses()
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    // map จาก entity → response
    res := make([]activeStatusResponse, 0, len(statuses))
    for _, s := range statuses {
        res = append(res, activeStatusResponse{
            ID:   s.ID,
            Name: s.ActiveStatusName,
        })
    }

    c.JSON(http.StatusOK, res)
}

// handler สำหรับ GET /api/active-statuses/:id
// ดึง ActiveStatus ตาม ID ที่ส่งมาใน path param
func (ctl *ActiveStatusController) GetByID(c *gin.Context) {
    idParam := c.Param("id")

    // แปลง string → uint
    idUint64, err := strconv.ParseUint(idParam, 10, 64)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
        return
    }

    status, err := ctl.activeStatusService.GetStatusByID(uint(idUint64))
    if err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
        return
    }

    res := activeStatusResponse{
        ID:   status.ID,
        Name: status.ActiveStatusName,
    }

    c.JSON(http.StatusOK, res)
}
