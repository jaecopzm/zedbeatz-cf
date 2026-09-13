package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/gorilla/websocket"
	"zedbeatz/backend/internal/realtime"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	// CORS is handled by global cors middleware; WS upgrade needs permissive CheckOrigin.
	// No auth required but optional device ID is read from ?device= / ?device_id= .
	CheckOrigin: func(r *http.Request) bool { return true },
}

// ServeWS upgrades the HTTP connection to WebSocket and registers the client
// with the realtime Hub. Query params:
//   - device / device_id (optional): subscribe this connection to device-specific
//     now-playing events in addition to global broadcasts.
//   - queue (optional): frontend ?queue= share URLs are passed through client-side;
//     no server-side queue state is needed — documented for passthrough compatibility.
func (e *Env) ServeWS(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("websocket upgrade failed: %v", err)
		return
	}
	deviceID := r.URL.Query().Get("device")
	if deviceID == "" {
		deviceID = r.URL.Query().Get("device_id")
	}
	// queue param is intentionally ignored server-side — frontend handles it (passthrough).
	// We read it only to document compatibility and avoid 400 on unknown param.
	_ = r.URL.Query().Get("queue")

	client := &realtime.Client{
		Hub:      e.Hub,
		Conn:     conn,
		Send:     make(chan []byte, 256),
		DeviceID: deviceID,
	}
	e.Hub.Register <- client

	// Write pump in goroutine, read pump blocks until disconnect.
	go client.WritePump()
	client.ReadPump()
}

// BroadcastNowPlaying publishes a track play event to all connected WebSocket clients.
// Called from LogPlay after inserting into recently_played.
func (e *Env) BroadcastNowPlaying(trackID int, userID string) {
	if e.Hub == nil {
		return
	}
	payload := map[string]any{
		"type":     "now_playing",
		"track_id": trackID,
		"user_id":  userID,
	}
	msg, err := json.Marshal(payload)
	if err != nil {
		return
	}
	select {
	case e.Hub.Broadcast <- msg:
	default:
		// Drop if broadcast channel is full to avoid blocking request path.
		log.Printf("realtime broadcast dropped (channel full) track_id=%d", trackID)
	}
}

// BroadcastNowPlayingFunc is a package-level helper for callers that hold a Hub directly.
func BroadcastNowPlaying(hub *realtime.Hub, trackID int, userID string) {
	if hub == nil {
		return
	}
	payload := map[string]any{
		"type":     "now_playing",
		"track_id": trackID,
		"user_id":  userID,
	}
	msg, err := json.Marshal(payload)
	if err != nil {
		return
	}
	select {
	case hub.Broadcast <- msg:
	default:
		log.Printf("realtime broadcast dropped (channel full) track_id=%d", trackID)
	}
}
