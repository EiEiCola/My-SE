package tests

// import (

// 	"github.com/sut68/team12/backend/internal/dto"
// 	"github.com/sut68/team12/backend/internal/app/services"
// 	"github.com/sut68/team12/backend/internal/entity"
// 	"github.com/sut68/team12/backend/internal/repositpry"
// 	"testing"

	

// 	"github.com/stretchr/testify/assert"
// 	"gorm.io/driver/sqlite"
// 	"gorm.io/gorm"
// )

// func setupTestDB() *gorm.DB {
// 	db, _ := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
// 	db.AutoMigrate(&entity.RequesFriend{}, &entity.Relations{}, &entity.Block{})
// 	return db
// }

// func TestSendRequest(t *testing.T) {
// 	db := setupTestDB()
// 	repo := repository.NewFriendRepository(db)
// 	svc := services.NewFriendService(repo)

// 	err := svc.SendRequest(dto.SendRequestDTO{SenderID: 1, ReceiverID: 2})
// 	assert.Nil(t, err)

// 	var count int64
// 	db.Model(&entity.RequesFriend{}).Count(&count)
// 	assert.Equal(t, int64(1), count)
// }
