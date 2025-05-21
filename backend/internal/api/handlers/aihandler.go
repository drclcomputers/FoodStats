// Copyright (c) 2025 @drclcomputers. All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

package handlers

import (
	"FoodStats/internal/ai"
	"FoodStats/internal/config"
	"encoding/json"
	"net/http"
)

var aiService = ai.NewAIService()

func SmartRecommendationsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Ingredients []string `json:"ingredients"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	if len(req.Ingredients) == 0 {
		err := json.NewEncoder(w).Encode("Failed to get recommendations!")
		if err != nil {
			http.Error(w, "Failed to get recommendations: "+err.Error(), http.StatusInternalServerError)
			return
		}
	} else {

		recommendations, err := aiService.GetRecipeRecommendations(req.Ingredients)
		if err != nil {
			http.Error(w, "Failed to get recommendations: "+err.Error(), http.StatusInternalServerError)
			return
		}

		json.NewEncoder(w).Encode(recommendations)
	}
}

func AnalyzeNutritionHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var ingredients []config.Ingredient
	if err := json.NewDecoder(r.Body).Decode(&ingredients); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	sessionID := config.GetSessionID(w, r)
	profile, hasProfile := userProfiles[sessionID]

	var analysis *config.NutritionAnalysis
	var err error

	if hasProfile {
		analysis, err = aiService.AnalyzeNutrition(ingredients, &profile)
	} else {
		analysis, err = aiService.AnalyzeNutrition(ingredients, nil)
	}

	if err != nil {
		var totalCalories, totalProteins, totalCarbs, totalFats, totalFiber float64
		for _, ing := range ingredients {
			totalCalories += ing.Calories
			totalProteins += ing.Proteins
			totalCarbs += ing.Carbs
			totalFats += ing.Fats
			totalFiber += ing.Fiber
		}
		resp := map[string]interface{}{
			"health_score":      nil,
			"recommendations":   []string{"AI analysis unavailable. Showing only basic nutrition."},
			"nutrient_balance":  nil,
			"nutrient_scores":   nil,
			"metrics_breakdown": nil,
			"totals": map[string]float64{
				"calories": totalCalories,
				"proteins": totalProteins,
				"carbs":    totalCarbs,
				"fats":     totalFats,
				"fiber":    totalFiber,
			},
		}
		w.Header().Set("Content-Type", "application/json")
		err = json.NewEncoder(w).Encode(resp)
		if err != nil {
			http.Error(w, "Failed to finish analysis: "+err.Error(), http.StatusInternalServerError)
			return
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(analysis)
	if err != nil {
		http.Error(w, "Failed to get analysis: "+err.Error(), http.StatusInternalServerError)
		return
	}
}
