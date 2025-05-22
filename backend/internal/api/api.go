// Copyright (c) 2025 @drclcomputers. All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

package api

import (
	handler "FoodStats/internal/api/handlers"
	"FoodStats/internal/api/middleware"
	"FoodStats/internal/config"
	"FoodStats/internal/database"
	"context"
	"encoding/json"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"runtime"
	"time"

	"github.com/gorilla/mux"
	"github.com/rs/zerolog"
)

func replitStaticSrv(logger zerolog.Logger, r *mux.Router) {
	frontendPath := "../frontend"

	isReplit := os.Getenv("REPLIT") == "true"
	if isReplit {
		wd, _ := os.Getwd()
		candidates := []string{
			"../frontend",
			"../../frontend",
			"/home/runner/FoodStats/frontend",
			filepath.Join(wd, "../frontend"),
			filepath.Join(wd, "frontend"),
		}

		for _, path := range candidates {
			if _, err := os.Stat(path); err == nil {
				frontendPath = path
				break
			}
		}

		logger.Info().Str("frontendPath", frontendPath).Msg("Using frontend path")
	}

	r.Use(middleware.StaticFileServer(frontendPath))
}

func NewRouter(logger zerolog.Logger) *mux.Router {
	r := mux.NewRouter()

	r.Use(middleware.Timeout(30 * time.Second))
	r.Use(middleware.Logger(logger))
	r.Use(middleware.Recoverer(logger))
	r.Use(middleware.SecurityHeaders())
	r.Use(middleware.RateLimit())
	r.Use(middleware.CORS())

	replitStaticSrv(logger, r)

	r.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" {
			w.Header().Set("Content-Type", "application/json")
			_, _ = w.Write([]byte(`{"status": "ok", "message": "FoodStats API is running"}`))
			return
		}
		http.NotFound(w, r)
	}).Methods(http.MethodGet)

	apiRouter := r.PathPrefix("/api").Subrouter()

	apiRouter.HandleFunc("/health", HealthCheckHandler).Methods(http.MethodGet)
	apiRouter.HandleFunc("/addingredient", handler.AddIngredientHandler).Methods(http.MethodPost, http.MethodOptions)
	apiRouter.HandleFunc("/calculate", handler.CalculateHandler).Methods(http.MethodGet, http.MethodOptions)
	apiRouter.HandleFunc("/reset", handler.ResetHandler).Methods(http.MethodDelete, http.MethodOptions)
	apiRouter.HandleFunc("/ingredients", handler.ListIngredientsHandler).Methods(http.MethodGet, http.MethodOptions)
	apiRouter.HandleFunc("/deleteingredient", handler.DeleteIngredientHandler).Methods(http.MethodDelete, http.MethodOptions)
	apiRouter.HandleFunc("/suggestions", handler.SuggestionHandler).Methods(http.MethodGet, http.MethodOptions)
	apiRouter.HandleFunc("/listrecipes", handler.ListRecipesHandler).Methods(http.MethodGet, http.MethodOptions)
	apiRouter.HandleFunc("/getrecipe", handler.GetRecipeHandler).Methods(http.MethodGet, http.MethodOptions)
	apiRouter.HandleFunc("/addrecipe", handler.AddRecipeHandler).Methods(http.MethodPost, http.MethodOptions)
	apiRouter.HandleFunc("/suggestrecipes", handler.SuggestRecipesHandler).Methods(http.MethodGet, http.MethodOptions)
	apiRouter.HandleFunc("/analyzenutrition", handler.AnalyzeNutritionHandler).Methods(http.MethodPost, http.MethodOptions)
	apiRouter.HandleFunc("/smartrecommendations", handler.SmartRecommendationsHandler).Methods(http.MethodPost, http.MethodOptions)
	apiRouter.HandleFunc("/saveprofile", handler.SaveProfileHandler).Methods(http.MethodPost, http.MethodOptions)
	apiRouter.HandleFunc("/getprofile", handler.GetProfileHandler).Methods(http.MethodGet, http.MethodOptions)
	apiRouter.HandleFunc("/resetprofile", handler.ResetProfileHandler).Methods(http.MethodDelete, http.MethodOptions)

	return r
}

func InitServer() {
	logger := zerolog.New(os.Stdout).With().Timestamp().Logger()

	maxRetries := 3
	for i := 0; i < maxRetries; i++ {
		if err := database.InitDB(); err == nil {
			break
		}
		if i == maxRetries-1 {
			logger.Fatal().Msg("Failed to initialize database")
		}
		time.Sleep(time.Second * 2)
	}
	defer database.CloseDB()

	r := NewRouter(logger)

	config.CleanupSessions()

	srv := &http.Server{
		Handler:      r,
		Addr:         ":" + config.GetPort(),
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		sigint := make(chan os.Signal, 1)
		signal.Notify(sigint, os.Interrupt)
		<-sigint

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		if err := srv.Shutdown(ctx); err != nil {
			logger.Error().Err(err).Msg("Server shutdown error")
		}
	}()

	logger.Info().Msgf("Server starting on port %s", config.GetPort())
	if err := srv.ListenAndServe(); err != http.ErrServerClosed {
		logger.Fatal().Err(err).Msg("Server error")
	}
}

func HealthCheckHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	status := map[string]interface{}{
		"status":    "ok",
		"timestamp": time.Now().UTC(),
		"version":   "4.0.0",
		"services":  make(map[string]string),
	}

	if err := database.DB.Ping(); err != nil {
		status["services"].(map[string]string)["database"] = "error"
		status["status"] = "degraded"
	} else {
		status["services"].(map[string]string)["database"] = "ok"
	}

	var m runtime.MemStats
	runtime.ReadMemStats(&m)
	status["memory"] = map[string]uint64{
		"alloc":      m.Alloc,
		"sys":        m.Sys,
		"goroutines": uint64(runtime.NumGoroutine()),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(status)
}
