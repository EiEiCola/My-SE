package controller

import (
	
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team12/backend/internal/app/services"
)

type GenderController struct {
	service services.GenderService
}

func NewGenderController(s services.GenderService) *GenderController {
	return &GenderController{service: s}
}

func (ctl *GenderController) List(c *gin.Context) {
	genders, err := ctl.service.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, genders)
}
