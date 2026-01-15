package controller

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
)

type UploadController struct{}

func NewUploadController() *UploadController {
	return &UploadController{}
}

// POST /api/member/upload
// POST /api/member/upload?type=group|image|file
func (ctl *UploadController) UploadFile(c *gin.Context) {
	// 1. รับไฟล์จาก Form-Data Key: "file"
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}

	// 2. รับ Type เพื่อแยกโฟลเดอร์
	uploadType := c.Query("type")
	subFolder := ""
	switch uploadType {
	case "group":
		subFolder = "chat/pictureGroup"
	case "image":
		subFolder = "chat/pictureChat"
	case "file":
		subFolder = "chat/fileChat"
	default:
		subFolder = "" // Default root uploads
	}

	uploadPath := filepath.Join("./uploads", subFolder)
	if _, err := os.Stat(uploadPath); os.IsNotExist(err) {
		os.MkdirAll(uploadPath, 0755) // MkdirAll สร้างโฟลเดอร์ย่อยได้
	}

	// 3. สร้างชื่อไฟล์ใหม่ (Unique)
	ext := filepath.Ext(file.Filename)
	filename := fmt.Sprintf("%d%s", time.Now().UnixNano(), ext)
	fullPath := filepath.Join(uploadPath, filename) // path ในระบบไฟล์

	// 4. บันทึกไฟล์
	if err := c.SaveUploadedFile(file, fullPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}

	// 5. เตรียมข้อมูลส่งกลับ
	// URL: http://host/uploads/subFolder/filename
	relativePath := "/uploads/" + filename
	if subFolder != "" {
		// ต้องแปลง \ เป็น / ในกรณี Windows
		relativePath = "/uploads/" + subFolder + "/" + filename
	}
	// แปลง backslash เป็น slash ให้เป็น URL format มาตรฐาน
	relativePath = filepath.ToSlash(relativePath)

	scheme := "http"
	if c.Request.TLS != nil {
		scheme = "https"
	}
	url := fmt.Sprintf("%s://%s%s", scheme, c.Request.Host, relativePath)

	// Return data for AttachmentChat
	c.JSON(http.StatusOK, gin.H{
		"url":       url,
		"file_name": file.Filename, // ชื่อไฟล์เดิม
		"file_size": fmt.Sprintf("%d", file.Size),
		"file_type": ext, // นามสกุล (.png, .pdf)
	})
}
