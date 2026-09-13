package middleware

import (
	"encoding/json"
	"net/http"
)

// No user auth. Only admin routes are guarded, via shared secret:
// client sends `x-admin-secret: <ADMIN_SECRET>`.
func OptionalAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		next.ServeHTTP(w, r)
	})
}

// RequireAdmin checks the shared admin secret header.
func RequireAdmin(adminSecret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if adminSecret == "" {
				writeErr(w, http.StatusServiceUnavailable, "admin not configured")
				return
			}
			if r.Header.Get("x-admin-secret") != adminSecret {
				writeErr(w, http.StatusForbidden, "forbidden")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// UserID is kept for compatibility — always anonymous now.
func UserID(_ *http.Request) string { return "" }

func writeErr(w http.ResponseWriter, code int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": msg})
}
