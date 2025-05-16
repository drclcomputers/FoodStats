// Copyright (c) 2025 @drclcomputers. All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

package api

import (
	"FoodStats/internal/config"
	"FoodStats/internal/database"
	"encoding/json"
	"github.com/google/uuid"
	"log"
	"net/http"
	"os"
	"sort"
	"strings"
	"sync"
)

var (
	userIngredients = make(map[string][]config.Ingredient)
	mu              sync.Mutex
)

func isDev() bool {
	return os.Getenv("GO_ENV") != "production"
}

func enableCORS(w http.ResponseWriter, r *http.Request) {
	origin := r.Header.Get("Origin")
	if isDev() || origin == "" || origin == "file://" || origin == "null" {
		w.Header().Set("Access-Control-Allow-Origin", "*")
	} else {
		w.Header().Set("Access-Control-Allow-Origin", "https://foodstats-frontend.onrender.com")
		w.Header().Set("Vary", "Origin")
	}
	w.Header().Set("Access-Control-Allow-Methods", "POST, GET, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Access-Control-Allow-Credentials", "true")
}

func getSessionID(w http.ResponseWriter, r *http.Request) string {
	// 1. Check for Electron
	if sid := r.URL.Query().Get("session_id"); sid != "" {
		return sid
	}
	// 2. Check for web
	cookie, err := r.Cookie("session_id")
	if err == nil && cookie.Value != "" {
		return cookie.Value
	}
	// 3. Create new session
	sessionID := uuid.New().String()
	http.SetCookie(w, &http.Cookie{
		Name:  "session_id",
		Value: sessionID,
		Path:  "/",
	})
	return sessionID
}

func InitServer() {
	database.InitDB()
	defer database.CloseDB()

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" {
			w.Header().Set("Content-Type", "application/json")
			_, _ = w.Write([]byte(`{"status": "ok", "message": "FoodStats API is running"}`))
			return
		}
		http.NotFound(w, r)
	})

	http.HandleFunc("/api/add-ingredient", addIngredientHandler)
	http.HandleFunc("/api/calculate", calculateHandler)
	http.HandleFunc("/api/reset", resetHandler)
	http.HandleFunc("/api/ingredients", listIngredientsHandler)
	http.HandleFunc("/api/delete-ingredient", deleteIngredientHandler)
	http.HandleFunc("/api/suggestions", suggestionHandler)
	http.HandleFunc("/api/list-recipes", listRecipesHandler)
	http.HandleFunc("/api/get-recipe", getRecipeHandler)
	http.HandleFunc("/api/add-recipe", addRecipeHandler)
	http.HandleFunc("/api/suggest-recipes", suggestRecipesHandler)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port: %s", port)
	log.Printf("Running in %s mode", map[bool]string{true: "development", false: "production"}[isDev()])

	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatal(err)
	}
}

func addIngredientHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	sessionID := getSessionID(w, r)

	var input config.TemplateIngredient
	err := json.NewDecoder(r.Body).Decode(&input)
	if err != nil || input.Grams <= 0 || input.Name == "" {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}
	input.Name = strings.TrimSpace(input.Name)
	input.Name = strings.ToLower(input.Name)
	if input.Grams <= 0 || input.Name == "" {
		http.Error(w, "Invalid input values", http.StatusBadRequest)
		return
	}

	ingredient, err := database.ReturnIngredient(input)
	if err != nil {
		http.Error(w, "Unknown ingredient", http.StatusNotFound)
		return
	}

	mu.Lock()
	defer mu.Unlock()
	for _, ing := range userIngredients[sessionID] {
		if ing.Name == ingredient.Name {
			http.Error(w, "Ingredient already added", http.StatusConflict)
			return
		}
	}
	userIngredients[sessionID] = append(userIngredients[sessionID], ingredient)

	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(ingredient)

	//fmt.Printf("SessionID: %s, Ingredients: %+v\n", sessionID, userIngredients[sessionID])
}

func listIngredientsHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r)
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	sessionID := getSessionID(w, r)

	mu.Lock()
	defer mu.Unlock()

	list := userIngredients[sessionID]
	sort.Slice(list, func(i, j int) bool {
		return list[i].Name < list[j].Name
	})

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(list)

}

func calculateHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	sessionID := getSessionID(w, r)

	mu.Lock()
	defer mu.Unlock()

	var total config.Ingredient
	total.Name = "Your recipe"
	for _, ing := range userIngredients[sessionID] {
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
	enableCORS(w, r)

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

	sessionID := getSessionID(w, r)

	mu.Lock()
	defer mu.Unlock()

	name = strings.ToLower(r.URL.Query().Get("name"))
	newList := make([]config.Ingredient, 0)
	for _, ing := range userIngredients[sessionID] {
		if strings.ToLower(ing.Name) != name {
			newList = append(newList, ing)
		}
	}
	userIngredients[sessionID] = newList

	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(`{"message":"Ingredient deleted."}`))
}

func resetHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	sessionID := getSessionID(w, r)

	mu.Lock()
	userIngredients[sessionID] = nil
	mu.Unlock()

	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(`{"message":"Ingredient list reset."}`))
}

func suggestionHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r)
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

func listRecipesHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r)
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

func getRecipeHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r)
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

func addRecipeHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r)
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

	err := database.AddRecipe(input.Name, input.Description, input.Ingredients)
	if err != nil {
		http.Error(w, "Failed to add recipe: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(map[string]string{"message": "Recipe added"})
}

func suggestRecipesHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r)
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	sessionID := getSessionID(w, r)

	mu.Lock()
	userIngs := make(map[string]bool)
	for _, ing := range userIngredients[sessionID] {
		userIngs[strings.ToLower(ing.Name)] = true
	}
	mu.Unlock()

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
