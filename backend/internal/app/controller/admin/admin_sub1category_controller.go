package controller

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/internal/dto"
)

// GET /admin/categories/sub1
// GET /admin/categories/sub1?main_category_id=1
func (ctl *AdminCategoryController) ListSubCategoryL1(c *gin.Context) {
	var mainID *uint
	if q := c.Query("main_category_id"); q != "" {
		n, err := strconv.Atoi(q)
		if err != nil || n <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid main_category_id"})
			return
		}
		id := uint(n)
		mainID = &id
	}

	items, err := ctl.Service.ListSubCategoryL1(mainID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": items})
}

// GET /admin/categories/sub1/:id
func (ctl *AdminCategoryController) GetSubCategoryL1(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	item, err := ctl.Service.GetSubCategoryL1ByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": item})
}

// POST /admin/categories/sub1
func (ctl *AdminCategoryController) CreateSubCategoryL1(c *gin.Context) {
	var req dto.CreateSubCategoryL1Request
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	adminID, ok := getAdminID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	item, err := ctl.Service.CreateSubCategoryL1(adminID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": item})
}

// PUT /admin/categories/sub1/:id
func (ctl *AdminCategoryController) UpdateSubCategoryL1(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var req dto.UpdateSubCategoryL1Request
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	item, err := ctl.Service.UpdateSubCategoryL1(id, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": item})
}

// DELETE /admin/categories/sub1/:id
func (ctl *AdminCategoryController) DeleteSubCategoryL1(c *gin.Context) {
	id, err := parseUintParam(c, "id")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	if err := ctl.Service.DeleteSubCategoryL1(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}
