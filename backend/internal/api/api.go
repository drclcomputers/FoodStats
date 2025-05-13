// Copyright (c) 2025 @drclcomputers. All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

package api

import (
	"FoodStats/internal/config"
	"FoodStats/internal/database"
	"encoding/json"
	"log"
	"net/http"
	"sort"
	"strings"
	"sync"
)

var (
	ingredientList []config.Ingredient
	mu             sync.Mutex
)

func enableCORS(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, GET, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
}

func InitServer() {
	database.InitDB()
	defer database.CloseDB()
	http.HandleFunc("/api/add-ingredient", addIngredientHandler)
	http.HandleFunc("/api/calculate", calculateHandler)
	http.HandleFunc("/api/reset", resetHandler)
	http.HandleFunc("/api/ingredients", listIngredientsHandler)
	http.HandleFunc("/api/delete-ingredient", deleteIngredientHandler)
	http.HandleFunc("/api/suggestions", suggestionHandler)

	log.Println("Server started on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func addIngredientHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var input config.TemplateIngredient
	err := json.NewDecoder(r.Body).Decode(&input)
	if err != nil || input.Grams <= 0 || input.Name == "" {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	input.Name = strings.TrimSpace(input.Name)

	if input.Grams <= 0 || input.Name == "" {
		http.Error(w, "Invalid input values", http.StatusBadRequest)
		return
	}

	ingredient, err := database.ReturnIngredient(input)
	if err != nil {
		http.Error(w, "Unknown ingredient", http.StatusNotFound)
		return
	}

	for _, ing := range ingredientList {
		if ing.Name == ingredient.Name {
			http.Error(w, "Ingredient already added", http.StatusConflict)
			return
		}
	}

	mu.Lock()
	ingredientList = append(ingredientList, ingredient)
	mu.Unlock()

	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(ingredient)
}

func listIngredientsHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	mu.Lock()
	defer mu.Unlock()

	sort.Slice(ingredientList, func(i, j int) bool {
		return ingredientList[i].Name < ingredientList[j].Name
	})

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(ingredientList)
}

func calculateHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	mu.Lock()
	defer mu.Unlock()

	var total config.Ingredient
	total.Name = "Your recipe"
	for _, ing := range ingredientList {
		total.Grams += ing.Grams
		total.Calories += ing.Calories
		total.Proteins += ing.Proteins
		total.Carbs += ing.Carbs
		total.Fats += ing.Fats
		total.Fiber += ing.Fiber
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(total)
}

func deleteIngredientHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	name := r.URL.Query().Get("name")
	if name == "" {
		http.Error(w, "Missing ingredient name", http.StatusBadRequest)
		return
	}

	mu.Lock()
	defer mu.Unlock()

	newList := make([]config.Ingredient, 0)
	for _, ing := range ingredientList {
		if ing.Name != name {
			newList = append(newList, ing)
		}
	}
	ingredientList = newList

	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(`{"message":"Ingredient deleted."}`))
}

func resetHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	mu.Lock()
	ingredientList = nil
	mu.Unlock()

	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(`{"message":"Ingredient list reset."}`))
}

func suggestionHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	query := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("query")))
	if query == "" {
		http.Error(w, "Missing query parameter", http.StatusBadRequest)
		return
	}

	mu.Lock()
	defer mu.Unlock()

	var suggestions []string
	for _, ing := range database.GetAllIngredients() {
		if strings.HasPrefix(strings.ToLower(ing.Name), query) {
			suggestions = append(suggestions, ing.Name)
		}
	}

	sort.Strings(suggestions)

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(suggestions)
}
