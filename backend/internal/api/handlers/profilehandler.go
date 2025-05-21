// Copyright (c) 2025 @drclcomputers. All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

package handlers

import (
	"FoodStats/internal/config"
	"encoding/json"
	"net/http"
)

var userProfiles = make(map[string]config.UserProfile)

func SaveProfileHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var profile config.UserProfile
	err := json.NewDecoder(r.Body).Decode(&profile)
	if err != nil {
		http.Error(w, "Invalid profile data", http.StatusBadRequest)
		return
	}

	if profile.Age < 1 || profile.Age > 120 {
		http.Error(w, "Invalid age", http.StatusBadRequest)
		return
	}

	if profile.Weight < 20 || profile.Weight > 300 {
		http.Error(w, "Invalid weight", http.StatusBadRequest)
		return
	}

	if profile.Height < 100 || profile.Height > 250 {
		http.Error(w, "Invalid height", http.StatusBadRequest)
		return
	}

	sessionID := config.GetSessionID(w, r)
	userProfiles[sessionID] = profile

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}

func GetProfileHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	sessionID := config.GetSessionID(w, r)
	profile, exists := userProfiles[sessionID]

	if !exists {
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"status": "no_profile"})
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(profile)
}

func ResetProfileHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	sessionID := config.GetSessionID(w, r)

	delete(userProfiles, sessionID)

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}
