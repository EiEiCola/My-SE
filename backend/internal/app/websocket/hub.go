package websocket

import (
	// "encoding/json"
	"log"
	"sync"
	// "time"

	// "github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/sut68/team12/backend/internal/entity"
	"gorm.io/gorm"
)

// Event Types
const (
	EventMessage      = "message"
	EventStatusChange = "status_change"
	EventTyping       = "typing"
)

type WSMessage struct {
    Type    string      `json:"type"`
    Payload interface{} `json:"payload"`
    RoomID  uint        `json:"room_id"` // ต้องมีอันนี้ไว้กรองคนรับ
}

type Hub struct {
	// Map เก็บ UserID -> Connection (1 คนอาจเข้าหลายเครื่องได้ ถ้าจะเอาละเอียดต้องเป็น list)
	Clients    map[uint]*websocket.Conn
	Register   chan *Client
	Unregister chan *Client
	Broadcast  chan WSMessage
	Mutex      sync.RWMutex
	DB         *gorm.DB
}

type Client struct {
	UserID uint
	Conn   *websocket.Conn
	Hub    *Hub
}

func NewHub(db *gorm.DB) *Hub {
	return &Hub{
		Clients:    make(map[uint]*websocket.Conn),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
		Broadcast:  make(chan WSMessage),
		DB:         db,
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.Mutex.Lock()
			h.Clients[client.UserID] = client.Conn
			
			// ✅ Update Active Status -> Online (ID 1 = Online สมมติ)
			h.DB.Model(&entity.Member{}).Where("id = ?", client.UserID).Update("active_status_id", 1)
			
			// แจ้งเพื่อนๆ ว่า online (ต้องเขียน Logic หาเพื่อนเพิ่ม)
			log.Printf("User %d Connected", client.UserID)
			h.Mutex.Unlock()

		case client := <-h.Unregister:
			h.Mutex.Lock()
			if _, ok := h.Clients[client.UserID]; ok {
				delete(h.Clients, client.UserID)
				client.Conn.Close()
				
				// ✅ Update Active Status -> Offline (ID 2 = Offline)
				h.DB.Model(&entity.Member{}).Where("id = ?", client.UserID).Update("active_status_id", 2)
			}
			h.Mutex.Unlock()

		case msg := <-h.Broadcast:
			// Logic การส่งข้อความหาคนในห้อง
			h.broadcastToRoom(msg)
		}
	}
}

func (h *Hub) broadcastToRoom(msg WSMessage) {
	// 1. หาว่าใครอยู่ในห้องบ้างจาก DB
	var memberIDs []uint
	h.DB.Table("room_members").Where("room_id = ?", msg.RoomID).Pluck("member_id", &memberIDs)

	h.Mutex.RLock()
	defer h.Mutex.RUnlock()

	for _, memberID := range memberIDs {
		// ส่งให้ทุกคนในห้องที่ Online อยู่ (รวมถึงคนส่งด้วย เพื่ออัปเดต UI)
		if conn, ok := h.Clients[memberID]; ok {
			conn.WriteJSON(msg)
		}
	}
}