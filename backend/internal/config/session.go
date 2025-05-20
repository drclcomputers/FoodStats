package config

import (
	"net/http"
	"sync"
	"time"

	"github.com/google/uuid"
)

type Session struct {
	ID        string
	CreatedAt time.Time
	LastSeen  time.Time
	Data      map[string]interface{}
}

var (
	sessions = make(map[string]*Session)
	mu       sync.RWMutex
)

func CleanupSessions() {
	ticker := time.NewTicker(30 * time.Minute)
	go func() {
		for range ticker.C {
			mu.Lock()
			now := time.Now()
			for id, session := range sessions {
				if now.Sub(session.LastSeen) > 24*time.Hour {
					delete(sessions, id)
				}
			}
			mu.Unlock()
		}
	}()
}

func GetSessionID(w http.ResponseWriter, r *http.Request) string {
	if sid := r.Header.Get("X-Session-ID"); sid != "" {
		return sid
	}

	if sid := r.URL.Query().Get("session_id"); sid != "" {
		return sid
	}

	if cookie, err := r.Cookie("session_id"); err == nil && cookie.Value != "" {
		return cookie.Value
	}

	sessionID := uuid.New().String()
	http.SetCookie(w, &http.Cookie{
		Name:     "session_id",
		Value:    sessionID,
		Path:     "/",
		HttpOnly: true,
		Secure:   !IsDev(),
	})
	return sessionID
}
