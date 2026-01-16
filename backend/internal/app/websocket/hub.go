package websocket

import (
	"sync"
	"time"

	"github.com/sut68/team12/backend/internal/entity"
	"gorm.io/gorm"
)

// Message struct สำหรับสื่อสารภายใน WS
type WSMessage struct {
	Type     string      `json:"type"`                // เช่น "new_message", "online_users", "user_online", "user_offline"
	Payload  interface{} `json:"payload"`             // ข้อมูลจริง
	RoomID   uint        `json:"room_id,omitempty"`   // ระบุห้อง (ถ้ามี)
	SenderID uint        `json:"sender_id,omitempty"` // ใครเป็นคนส่ง
	TargetID uint        `json:"target_id,omitempty"` // ส่งหาใคร (กรณี Private Noti)
}

type Hub struct {
	Clients    map[*Client]bool
	Register   chan *Client
	Unregister chan *Client
	Broadcast  chan WSMessage

	// ⭐ New: Channel for targeted matched broadcasting (prevents global spam)
	TargetedBroadcast chan WSMessageWithTargets

	// เก็บสถานะ Online: UserID -> จำนวน Device ที่ต่ออยู่
	OnlineUsers map[uint]int
	mu          sync.RWMutex

	// ✅ Database connection for persisting status changes
	db *gorm.DB
}

// Wrapper to carry target IDs
type WSMessageWithTargets struct {
	Msg       WSMessage
	TargetIDs []uint
}

func NewHub(db *gorm.DB) *Hub {
	return &Hub{
		Register:          make(chan *Client),
		Unregister:        make(chan *Client),
		Clients:           make(map[*Client]bool),
		Broadcast:         make(chan WSMessage),
		TargetedBroadcast: make(chan WSMessageWithTargets),
		OnlineUsers:       make(map[uint]int),
		db:                db,
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.register(client)
		case client := <-h.Unregister:
			h.unregister(client)
		case msg := <-h.Broadcast:
			h.broadcast(msg)
		case targetMsg := <-h.TargetedBroadcast:
			h.broadcastToTargets(targetMsg.TargetIDs, targetMsg.Msg)
		}
	}
}

// ✅ Efficiently send to specific users only
func (h *Hub) broadcastToTargets(targetIDs []uint, msg WSMessage) {
	// Create a Set for fast lookup
	targetSet := make(map[uint]bool)
	for _, id := range targetIDs {
		targetSet[id] = true
	}

	for client := range h.Clients {
		if targetSet[client.UserID] {
			select {
			case client.Send <- msg:
			default:
				close(client.Send)
				delete(h.Clients, client)
			}
		}
	}
}

func (h *Hub) register(client *Client) {
	h.Clients[client] = true

	h.mu.Lock()
	wasOffline := h.OnlineUsers[client.UserID] == 0
	h.OnlineUsers[client.UserID]++
	h.mu.Unlock()

	// ✅ Update database: Set to Online if this is first device
	if wasOffline {
		now := time.Now()
		h.db.Model(&entity.Member{}).Where("id = ?", client.UserID).Updates(map[string]interface{}{
			"active_status_id": 1,
			"last_activity":    now,
		})
	}

	// 1. บอกคนมาใหม่ว่าใครออนไลน์บ้าง
	h.sendOnlineListTo(client)

	// 2. บอกคนอื่นว่า user นี้ออนไลน์แล้ว (Broadcast ทุกคน)
	if wasOffline {
		h.broadcastToAll(WSMessage{
			Type:    "user_online",
			Payload: client.UserID,
		})
	}
}

func (h *Hub) unregister(client *Client) {
	if _, ok := h.Clients[client]; ok {
		delete(h.Clients, client)
		close(client.Send)

		h.mu.Lock()
		h.OnlineUsers[client.UserID]--
		if h.OnlineUsers[client.UserID] <= 0 {
			delete(h.OnlineUsers, client.UserID)
		}
		h.mu.Unlock()

		// ถ้าออฟไลน์จริง (ไม่เหลือ Device) ให้บอกคนอื่น
		h.mu.RLock()
		if _, stillOn := h.OnlineUsers[client.UserID]; !stillOn {
			// ✅ Update database: Set to Offline
			h.db.Model(&entity.Member{}).Where("id = ?", client.UserID).Update("active_status_id", 2)

			h.broadcastToAll(WSMessage{
				Type:    "user_offline",
				Payload: client.UserID,
			})
		}
		h.mu.RUnlock()
	}
}

// Broadcast หา User ทุกคน (ที่อยู่ใน Clients)
func (h *Hub) broadcast(msg WSMessage) {
	for client := range h.Clients {
		// Logic กรองห้อง: ถ้า msg มี RoomID อาจจะกรองส่งเฉพาะคนในห้อง
		// แต่ในที่นี้ส่งให้ Frontend กรองต่อเอง หรือถ้าต้องการ Performance สูงๆ ค่อยมาเขียน Logic เช็ค RoomID ตรงนี้
		select {
		case client.Send <- msg:
		default:
			close(client.Send)
			delete(h.Clients, client)
		}
	}
}

// ส่ง List คนออนไลน์หาคนคนเดียว (คนที่เพิ่งเข้ามา)
func (h *Hub) sendOnlineListTo(client *Client) {
	h.mu.RLock()
	keys := make([]uint, 0, len(h.OnlineUsers))
	for k := range h.OnlineUsers {
		keys = append(keys, k)
	}
	h.mu.RUnlock()

	client.Send <- WSMessage{Type: "online_users", Payload: keys}
}

// Helper: ส่งหาทุกคน
func (h *Hub) broadcastToAll(msg WSMessage) {
	for client := range h.Clients {
		select {
		case client.Send <- msg:
		default:
			close(client.Send)
			delete(h.Clients, client)
		}
	}
}

// Helper: ส่งหา User ระบุคน (เช่น แจ้งเตือนแชทเข้า)
func (h *Hub) SendToUser(userID uint, msg WSMessage) {
	for client := range h.Clients {
		if client.UserID == userID {
			select {
			case client.Send <- msg:
			default:
				close(client.Send)
				delete(h.Clients, client)
			}
		}
	}
}
