package handlers

import (
	"FoodStats/internal/config"
	"FoodStats/internal/database"
	"encoding/json"
	"net/http"
	"sort"
	"strings"
)

func AddIngredientHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	sessionID := config.GetSessionID(w, r)

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

	config.MU.Lock()
	defer config.MU.Unlock()
	for _, ing := range config.UserIngredients[sessionID] {
		if ing.Name == ingredient.Name {
			http.Error(w, "Ingredient already added", http.StatusConflict)
			return
		}
	}
	config.UserIngredients[sessionID] = append(config.UserIngredients[sessionID], ingredient)

	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(ingredient)

	//fmt.Printf("SessionID: %s, Ingredients: %+v\n", sessionID, config.UserIngredients[sessionID])
}

func ListIngredientsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	sessionID := config.GetSessionID(w, r)

	config.MU.Lock()
	defer config.MU.Unlock()

	list := config.UserIngredients[sessionID]
	sort.Slice(list, func(i, j int) bool {
		return list[i].Name < list[j].Name
	})

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(list)

}

func CalculateHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	sessionID := config.GetSessionID(w, r)

	config.MU.Lock()
	defer config.MU.Unlock()

	var total config.Ingredient
	total.Name = "Your recipe"
	for _, ing := range config.UserIngredients[sessionID] {
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

func DeleteIngredientHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	name := r.URL.Query().Get("name")
	if name == "" {
		http.Error(w, "Missing ingredient name", http.StatusBadRequest)
		return
	}

	sessionID := config.GetSessionID(w, r)

	config.MU.Lock()
	defer config.MU.Unlock()

	name = strings.ToLower(r.URL.Query().Get("name"))
	newList := make([]config.Ingredient, 0)
	for _, ing := range config.UserIngredients[sessionID] {
		if strings.ToLower(ing.Name) != name {
			newList = append(newList, ing)
		}
	}
	config.UserIngredients[sessionID] = newList

	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(`{"message":"Ingredient deleted."}`))
}

func ResetHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	sessionID := config.GetSessionID(w, r)

	config.MU.Lock()
	config.UserIngredients[sessionID] = nil
	config.MU.Unlock()

	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(`{"message":"Ingredient list reset."}`))
}
