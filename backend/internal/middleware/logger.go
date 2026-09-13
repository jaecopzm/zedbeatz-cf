package middleware

import (
	"bufio"
	"context"
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"time"

	"github.com/google/uuid"
)

// contextKey is a private type to avoid collisions.
type contextKey string

const requestIDKey contextKey = "request_id"

// RequestID ensures every request has an X-Request-ID. It propagates the
// incoming header value or generates a new UUID. The ID is set on both the
// response header and the request context/header for downstream handlers.
func RequestID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		id := r.Header.Get("X-Request-ID")
		if id == "" {
			id = uuid.NewString()
		}
		w.Header().Set("X-Request-ID", id)
		ctx := context.WithValue(r.Context(), requestIDKey, id)
		r.Header.Set("X-Request-ID", id)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// GetRequestID retrieves the request ID from context or header.
func GetRequestID(r *http.Request) string {
	if v := r.Context().Value(requestIDKey); v != nil {
		if s, ok := v.(string); ok && s != "" {
			return s
		}
	}
	return r.Header.Get("X-Request-ID")
}

// Logger is structured JSON logging middleware. It logs method, path, status,
// duration, request_id, remote_ip, user_agent as JSON to stdout via slog.
func Logger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		ww := &responseRecorder{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(ww, r)
		duration := time.Since(start)

		reqID := GetRequestID(r)
		// Fallback: response header may have been set by RequestID before
		// context was populated (edge cases).
		if reqID == "" {
			reqID = w.Header().Get("X-Request-ID")
		}

		slog.Info("request",
			"method", r.Method,
			"path", r.URL.Path,
			"status", ww.status,
			"duration", duration.String(),
			"duration_ms", duration.Milliseconds(),
			"request_id", reqID,
			"remote_ip", clientIP(r),
			"user_agent", r.UserAgent(),
		)
	})
}

type responseRecorder struct {
	http.ResponseWriter
	status int
}

func (r *responseRecorder) WriteHeader(code int) {
	r.status = code
	r.ResponseWriter.WriteHeader(code)
}

func (r *responseRecorder) Hijack() (net.Conn, *bufio.ReadWriter, error) {
	if h, ok := r.ResponseWriter.(http.Hijacker); ok {
		return h.Hijack()
	}
	return nil, nil, fmt.Errorf("response does not implement http.Hijacker")
}

func (r *responseRecorder) Flush() {
	if f, ok := r.ResponseWriter.(http.Flusher); ok {
		f.Flush()
	}
}

// clientIP extracts the remote IP considering X-Forwarded-For and X-Real-IP.
func clientIP(r *http.Request) string {
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		// Take first IP in list.
		for i, c := range xff {
			if c == ',' {
				return trimSpace(xff[:i])
			}
		}
		return trimSpace(xff)
	}
	if xri := r.Header.Get("X-Real-IP"); xri != "" {
		return trimSpace(xri)
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}

func trimSpace(s string) string {
	for len(s) > 0 && (s[0] == ' ' || s[0] == '\t') {
		s = s[1:]
	}
	for len(s) > 0 && (s[len(s)-1] == ' ' || s[len(s)-1] == '\t') {
		s = s[:len(s)-1]
	}
	return s
}
