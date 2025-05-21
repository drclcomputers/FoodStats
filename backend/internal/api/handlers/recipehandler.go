// Copyright (c) 2025 @drclcomputers. All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

package handlers

import (
	"FoodStats/internal/config"
	"FoodStats/internal/database"
	"encoding/json"
	"net/http"
	"sort"
	"strings"
)

func SuggestionHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	query := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("query")))
	if query == "" {
		http.Error(w, "Missing query parameter", http.StatusBadRequest)
		return
	}

	config.MU.Lock()
	defer config.MU.Unlock()

	var suggestions []string
	for _, ing := range database.GetAllIngredients() {
		if strings.Contains(strings.ToLower(ing.Name), query) {
			suggestions = append(suggestions, ing.Name)
		}
	}

	sort.Strings(suggestions)

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(suggestions)
}

func ListRecipesHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	recipes, err := database.ListRecipes()
	if err != nil {
		http.Error(w, "Failed to fetch recipes", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(recipes)
}

func GetRecipeHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	name := r.URL.Query().Get("name")
	if name == "" {
		http.Error(w, "Missing recipe name", http.StatusBadRequest)
		return
	}

	recipe, err := database.GetRecipe(name)
	if err != nil {
		http.Error(w, "Recipe not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(recipe)
}

func AddRecipeHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var input config.Recipe
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}
	if input.Name == "" || len(input.Ingredients) == 0 {
		http.Error(w, "Missing recipe name or ingredients", http.StatusBadRequest)
		return
	}

	var templateIngredients []config.TemplateIngredient
	for _, ing := range input.Ingredients {
		templateIngredients = append(templateIngredients, config.TemplateIngredient{
			Name:  ing.Name,
			Grams: ing.Grams,
		})
	}
	err := database.AddRecipe(input.Name, input.Description, templateIngredients)
	if err != nil {
		http.Error(w, "Failed to add recipe: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(map[string]string{"message": "Recipe added"})
}

func SuggestRecipesHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	sessionID := config.GetSessionID(w, r)

	config.MU.Lock()
	userIngs := make(map[string]bool)
	for _, ing := range config.UserIngredients[sessionID] {
		userIngs[strings.ToLower(ing.Name)] = true
	}
	config.MU.Unlock()

	recipes, err := database.ListRecipes()
	if err != nil {
		http.Error(w, "Failed to fetch recipes", http.StatusInternalServerError)
		return
	}

	type suggestion struct {
		config.Recipe
		Matches int `json:"matches"`
		Total   int `json:"total"`
	}
	var suggestions []suggestion

	for _, recipe := range recipes {
		matchCount := 0
		for _, ing := range recipe.Ingredients {
			if userIngs[strings.ToLower(ing.Name)] {
				matchCount++
			}
		}
		if matchCount > 0 {
			suggestions = append(suggestions, suggestion{
				Recipe:  recipe,
				Matches: matchCount,
				Total:   len(recipe.Ingredients),
			})
		}
	}
	sort.Slice(suggestions, func(i, j int) bool {
		return suggestions[i].Matches > suggestions[j].Matches
	})
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(suggestions)
}
