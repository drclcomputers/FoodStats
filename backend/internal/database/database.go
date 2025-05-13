// Copyright (c) 2025 @drclcomputers. All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

package database

import (
	"FoodStats/internal/config"
	"database/sql"
	"fmt"
	_ "github.com/mattn/go-sqlite3"
	"log"
	"os"
)

var DB *sql.DB

func InitDB() {
	var err error
	dbPath := "./internal/database/nutrition_data.db"

	if _, err := os.Stat(dbPath); os.IsNotExist(err) {
		dbPath = "./backend/database/nutrition_data.db"
	}

	DB, err = sql.Open("sqlite3", dbPath)
	if err != nil {
		log.Fatal("DB connect error:", err)
	}
	if err := DB.Ping(); err != nil {
		log.Fatal("DB ping failed:", err)
	}
	log.Printf("Database connected successfully at: %s", dbPath)
}

func CloseDB() {
	if err := DB.Close(); err != nil {
		log.Fatal("Failed to close database:", err)
	}
	log.Println("Database connection closed.")
}

func ReturnIngredient(ingredient config.TemplateIngredient) (config.Ingredient, error) {
	query := `SELECT CALORIES, PROTEINS, CARBS, FATS, FIBER FROM ingredients WHERE LOWER(NAME) = LOWER(?)`
	var ingredientDataPerCent config.Ingredient
	err := DB.QueryRow(query, ingredient.Name).Scan(
		&ingredientDataPerCent.Calories,
		&ingredientDataPerCent.Proteins,
		&ingredientDataPerCent.Carbs,
		&ingredientDataPerCent.Fats,
		&ingredientDataPerCent.Fiber,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			log.Printf("Ingredient '%s' not found in the database.\n", ingredient.Name)
			return config.Ingredient{}, fmt.Errorf("ingredient not found")
		}
		log.Println("Error executing query:", err)
		return config.Ingredient{}, err
	}

	var data config.Ingredient
	data.Name = ingredient.Name
	data.Grams = ingredient.Grams
	data.Calories = data.Grams * ingredientDataPerCent.Calories / 100
	data.Proteins = data.Grams * ingredientDataPerCent.Proteins / 100
	data.Carbs = data.Grams * ingredientDataPerCent.Carbs / 100
	data.Fats = data.Grams * ingredientDataPerCent.Fats / 100
	data.Fiber = data.Grams * ingredientDataPerCent.Fiber / 100

	return data, nil
}

func GetAllIngredients() []config.Ingredient {
	rows, err := DB.Query("SELECT name FROM ingredients")
	if err != nil {
		log.Println("Error fetching ingredients:", err)
		return nil
	}
	defer rows.Close()

	var list []config.Ingredient
	for rows.Next() {
		var ing config.Ingredient
		if err := rows.Scan(&ing.Name); err == nil {
			list = append(list, ing)
		}
	}
	return list
}
