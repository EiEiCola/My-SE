package services

import (
	"log"
	"time"

	"github.com/sut68/team12/backend/internal/app/repository"
	"github.com/sut68/team12/backend/internal/app/websocket"
)

// CleanupService handles periodic cleanup tasks like setting inactive users offline
type CleanupService struct {
	memberRepo repository.MemberRepository
	hub        *websocket.Hub
	ticker     *time.Ticker
	done       chan bool
}

// NewCleanupService creates a new cleanup service
func NewCleanupService(memberRepo repository.MemberRepository, hub *websocket.Hub) *CleanupService {
	return &CleanupService{
		memberRepo: memberRepo,
		hub:        hub,
		done:       make(chan bool),
	}
}

// Start begins the cleanup service with 1-minute intervals
func (s *CleanupService) Start() {
	s.ticker = time.NewTicker(1 * time.Minute)

	go func() {
		log.Println("✅ Cleanup Service Started: Checking for inactive users every minute")

		for {
			select {
			case <-s.ticker.C:
				s.checkInactiveUsers()
			case <-s.done:
				s.ticker.Stop()
				log.Println("❌ Cleanup Service Stopped")
				return
			}
		}
	}()
}

// Stop stops the cleanup service
func (s *CleanupService) Stop() {
	s.done <- true
}

// checkInactiveUsers sets users offline if they've been inactive for 5+ minutes
func (s *CleanupService) checkInactiveUsers() {
	// Set users to offline if inactive for 5 minutes
	err := s.memberRepo.SetInactiveMembersOffline(5)
	if err != nil {
		log.Printf("⚠️ Error setting inactive users offline: %v\n", err)
		return
	}

	// Note: We don't need to broadcast here because the Hub will handle
	// WebSocket disconnections which will trigger offline broadcasts
	// This is a backup cleanup for edge cases
}
