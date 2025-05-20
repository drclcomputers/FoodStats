package middleware

import (
	"net/http"
	"time"

	"golang.org/x/time/rate"
)

func SecurityHeaders() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

			w.Header().Set("X-XSS-Protection", "1; mode=block")

			w.Header().Set("X-Frame-Options", "DENY")

			w.Header().Set("X-Content-Type-Options", "nosniff")

			w.Header().Set("Content-Security-Policy",
				"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';")

			next.ServeHTTP(w, r)
		})
	}
}

func RateLimit() func(http.Handler) http.Handler {
	limiter := rate.NewLimiter(rate.Every(time.Minute), 1000)

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if !limiter.Allow() {
				http.Error(w, "Rate limit exceeded", http.StatusTooManyRequests)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
