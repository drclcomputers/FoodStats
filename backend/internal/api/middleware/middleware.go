// Copyright (c) 2025 @drclcomputers. All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

package middleware

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/rs/zerolog"
)

func CORS() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")

			allowedOrigins := []string{
				"https://foodstats.onrender.com",
				"https://foodstats-frontend.onrender.com",
				"http://localhost:8080",
				"http://localhost:3000",
			}

			allowOrigin := false
			for _, allowed := range allowedOrigins {
				if origin == allowed {
					allowOrigin = true
					break
				}
			}

			if strings.Contains(origin, ".onrender.com") {
				allowOrigin = true
			}

			if allowOrigin {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				w.Header().Set("Vary", "Origin")
			} else if origin == "" || origin == "file://" || origin == "null" {
				w.Header().Set("Access-Control-Allow-Origin", "*")
			}

			next.ServeHTTP(w, r)
		})
	}
}

func Logger(logger zerolog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()

			rw := &responseWriter{ResponseWriter: w}

			next.ServeHTTP(rw, r)

			logger.Info().
				Str("method", r.Method).
				Str("path", r.URL.Path).
				Int("status", rw.status).
				Dur("duration", time.Since(start)).
				Str("ip", r.RemoteAddr).
				Msg("request completed")
		})
	}
}

func Recoverer(logger zerolog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			defer func() {
				if err := recover(); err != nil {
					logger.Error().
						Interface("error", err).
						Str("path", r.URL.Path).
						Msg("panic recovered")

					http.Error(w, "Internal Server Error", http.StatusInternalServerError)
				}
			}()

			next.ServeHTTP(w, r)
		})
	}
}

func Timeout(timeout time.Duration) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx, cancel := context.WithTimeout(r.Context(), timeout)
			defer cancel()

			r = r.WithContext(ctx)
			done := make(chan struct{})

			go func() {
				next.ServeHTTP(w, r)
				close(done)
			}()

			select {
			case <-done:
				return
			case <-ctx.Done():
				http.Error(w, "Request Timeout", http.StatusGatewayTimeout)
			}
		})
	}
}

func ValidateJSONRequest(next http.HandlerFunc, schema interface{}) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Body == nil {
			http.Error(w, "Request body is empty", http.StatusBadRequest)
			return
		}

		err := json.NewDecoder(r.Body).Decode(&schema)
		if err != nil {
			http.Error(w, "Invalid JSON format", http.StatusBadRequest)
			return
		}

		next.ServeHTTP(w, r)
	}
}

type responseWriter struct {
	http.ResponseWriter
	status int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.status = code
	rw.ResponseWriter.WriteHeader(code)
}
