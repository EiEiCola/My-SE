package controller

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/internal/dto"
)

// GET /admin/categories/sub2
// GET /admin/categories/sub2?sub_category_l1_id=1
func (ctl *AdminCategoryController) ListSubCategoryL2(c *gin.Context) {
	var sub1ID *uint
	if q := c.Query("sub_category_l1_id"); q != "" {
		n, err := strconv.Atoi(q)
		if err != nil || n <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid sub_category_l1_id"})
			return
		}
		id := uint(n)
		sub1ID = &id
	}

	items, err := ctl.Service.ListSubCategoryL2(sub1ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": items})
}

// GET /admin/categories/sub2/:id
func (ctl *AdminCategoryController) GetSubCategoryL2(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	item, err := ctl.Service.GetSubCategoryL2ByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": item})
}

// POST /admin/categories/sub2
func (ctl *AdminCategoryController) CreateSubCategoryL2(c *gin.Context) {
	var req dto.CreateSubCategoryL2Request
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	adminID, ok := getAdminID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	item, err := ctl.Service.CreateSubCategoryL2(adminID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": item})
}

// PUT /admin/categories/sub2/:id
func (ctl *AdminCategoryController) UpdateSubCategoryL2(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var req dto.UpdateSubCategoryL2Request
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	item, err := ctl.Service.UpdateSubCategoryL2(id, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": item})
}

// DELETE /admin/categories/sub2/:id
func (ctl *AdminCategoryController) DeleteSubCategoryL2(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	if err := ctl.Service.DeleteSubCategoryL2(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}
