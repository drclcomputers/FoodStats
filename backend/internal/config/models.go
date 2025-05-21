// Copyright (c) 2025 @drclcomputers. All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

package config

type TemplateIngredient struct {
	Name  string  `json:"name"`
	Grams float64 `json:"grams"`
}

type NutritionalInfo struct {
	Calories float64 `json:"calories"`
	Proteins float64 `json:"proteins"`
	Carbs    float64 `json:"carbs"`
	Fats     float64 `json:"fats"`
	Fiber    float64 `json:"fiber"`
}

type Ingredient struct {
	TemplateIngredient
	NutritionalInfo
}

type Recipe struct {
	ID          int          `json:"id,omitempty"`
	Name        string       `json:"name"`
	Description string       `json:"description,omitempty"`
	Ingredients []Ingredient `json:"ingredients,omitempty"`
	Similarity  float64      `json:"similarity,omitempty"`
	Vegan       bool         `json:"vegan,omitempty"`
}

type NutritionAnalysis struct {
	HealthScore     float64            `json:"health_score"`
	Recommendations []string           `json:"recommendations"`
	NutrientBalance map[string]float64 `json:"nutrient_balance"`
}

type UserProfile struct {
	Age                 int      `json:"age"`
	Gender              string   `json:"gender"`
	Weight              float64  `json:"weight"`
	Height              float64  `json:"height"`
	ActivityLevel       string   `json:"activityLevel"`
	Goal                string   `json:"goal"`
	DietaryRestrictions []string `json:"dietary_restrictions"`
}
