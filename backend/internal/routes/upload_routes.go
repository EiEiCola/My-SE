package routes

import (
	"github.com/gin-gonic/gin"
	m "github.com/sut68/team12/backend/internal/app/controller/member"
)

func SetupUploadRoutes(api *gin.RouterGroup, uploadCtl *m.UploadController) {
	api.POST("/upload", uploadCtl.UploadFile)
}
