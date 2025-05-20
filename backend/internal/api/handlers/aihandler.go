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

	recommendations, err := aiService.GetRecipeRecommendations(req.Ingredients)
	if err != nil {
		http.Error(w, "Failed to get recommendations: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(recommendations)
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

	analysis, err := aiService.AnalyzeNutrition(ingredients)
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
		json.NewEncoder(w).Encode(resp)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(analysis)
}
