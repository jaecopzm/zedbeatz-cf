package middleware

import (
	"context"
	"net/http"

	"github.com/google/uuid"
)

// deviceIDKey is the context key for the device ID.
type deviceIDKeyType string

const deviceIDContextKey deviceIDKeyType = "device_id"
const deviceProvidedKey deviceIDKeyType = "device_provided"

// Device is middleware that extracts X-Device-ID header (UUID v4).
// It validates UUID format, stores in context, and makes DeviceID(r) available.
// If missing or invalid, it generates an ephemeral UUID but still allows the request (anonymous).
func Device(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		raw := r.Header.Get("X-Device-ID")
		var id string
		provided := false
		if raw != "" {
			if _, err := uuid.Parse(raw); err == nil {
				// Valid UUID (any version, but client should generate v4)
				id = raw
				provided = true
			} else {
				// Invalid format -> generate ephemeral
				id = uuid.NewString()
			}
		} else {
			// Missing -> generate ephemeral
			id = uuid.NewString()
		}
		// Store in context
		ctx := context.WithValue(r.Context(), deviceIDContextKey, id)
		ctx = context.WithValue(ctx, deviceProvidedKey, provided)
		// Echo / set header for downstream and client
		w.Header().Set("X-Device-ID", id)
		// Also set on request header so downstream that reads header directly sees the effective ID
		// Use a cloned request with new context and updated header
		r2 := r.WithContext(ctx)
		// Preserve original header if valid, otherwise set ephemeral
		r2.Header.Set("X-Device-ID", id)
		next.ServeHTTP(w, r2)
	})
}

// DeviceID returns the device ID from request context or header.
// Returns ephemeral UUID if middleware generated one, or client-provided UUID if valid.
// Returns "" only if middleware was not applied and no valid header present.
func DeviceID(r *http.Request) string {
	if v := r.Context().Value(deviceIDContextKey); v != nil {
		if s, ok := v.(string); ok && s != "" {
			return s
		}
	}
	// Fallback: try header directly (for tests or when middleware not used)
	h := r.Header.Get("X-Device-ID")
	if h != "" {
		if _, err := uuid.Parse(h); err == nil {
			return h
		}
	}
	return ""
}

// HasDeviceID reports whether the request had a valid client-provided X-Device-ID.
// This can be used to distinguish ephemeral (generated) IDs from client-provided ones.
func HasDeviceID(r *http.Request) bool {
	if v := r.Context().Value(deviceProvidedKey); v != nil {
		if b, ok := v.(bool); ok {
			return b
		}
	}
	// Fallback when middleware not applied: check header validity
	h := r.Header.Get("X-Device-ID")
	if h != "" {
		if _, err := uuid.Parse(h); err == nil {
			return true
		}
	}
	return false
}

// DeviceProvided is an alias for HasDeviceID.
func DeviceProvided(r *http.Request) bool { return HasDeviceID(r) }
