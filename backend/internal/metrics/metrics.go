package metrics

import (
	"bufio"
	"fmt"
	"net"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

// Prometheus metrics required by the observability lane.
var (
	// httpRequestsTotal – Counter vec with labels method, route, status.
	HTTPRequestsTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "http_requests_total",
			Help: "Total number of HTTP requests.",
		},
		[]string{"method", "route", "status"},
	)

	// httpRequestDuration – Histogram vec with labels method, route, status.
	HTTPRequestDuration = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "http_request_duration_seconds",
			Help:    "HTTP request duration in seconds.",
			Buckets: prometheus.DefBuckets,
		},
		[]string{"method", "route", "status"},
	)

	// dbQueryDuration – Histogram vec with label query.
	DBQueryDuration = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "db_query_duration_seconds",
			Help:    "Database query duration in seconds.",
			Buckets: prometheus.DefBuckets,
		},
		[]string{"query"},
	)

	// cacheHits – Counter vec with label result (hit|miss).
	CacheHits = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "cache_hits_total",
			Help: "Total number of cache hits and misses.",
		},
		[]string{"result"},
	)
)

func init() {
	prometheus.MustRegister(HTTPRequestsTotal, HTTPRequestDuration, DBQueryDuration, CacheHits)
	// Seed db/cache metrics so they appear on /metrics even before first observation.
	// Uses zero values that do not affect real counters.
	DBQueryDuration.WithLabelValues("init").Observe(0)
	CacheHits.WithLabelValues("hit").Add(0)
	CacheHits.WithLabelValues("miss").Add(0)
}

// Handler returns the Prometheus HTTP handler for /metrics.
func Handler() http.Handler {
	return promhttp.Handler()
}

// ObserveDBQuery records a DB query duration. Label `query` should be a
// logical query name (e.g. "tracks.list", "artists.get").
func ObserveDBQuery(query string, d time.Duration) {
	DBQueryDuration.WithLabelValues(query).Observe(d.Seconds())
}

// IncCacheHit increments the cache hit/miss counter.
// result must be "hit" or "miss".
func IncCacheHit(result string) {
	CacheHits.WithLabelValues(result).Inc()
}

// IncCacheHits is an alias for IncCacheHit for convenience.
func IncCacheHits(result string) {
	IncCacheHit(result)
}

// Middleware records Prometheus metrics for every HTTP request.
func Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		ww := &statusRecorder{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(ww, r)
		duration := time.Since(start).Seconds()
		route := routePattern(r)
		status := strconv.Itoa(ww.status)
		HTTPRequestsTotal.WithLabelValues(r.Method, route, status).Inc()
		HTTPRequestDuration.WithLabelValues(r.Method, route, status).Observe(duration)
	})
}

type statusRecorder struct {
	http.ResponseWriter
	status int
}

func (r *statusRecorder) WriteHeader(code int) {
	r.status = code
	r.ResponseWriter.WriteHeader(code)
}

func (r *statusRecorder) Hijack() (net.Conn, *bufio.ReadWriter, error) {
	if h, ok := r.ResponseWriter.(http.Hijacker); ok {
		return h.Hijack()
	}
	return nil, nil, fmt.Errorf("response does not implement http.Hijacker")
}

func (r *statusRecorder) Flush() {
	if f, ok := r.ResponseWriter.(http.Flusher); ok {
		f.Flush()
	}
}

func routePattern(r *http.Request) string {
	if ctx := chi.RouteContext(r.Context()); ctx != nil && ctx.RoutePattern() != "" {
		return ctx.RoutePattern()
	}
	return r.URL.Path
}
