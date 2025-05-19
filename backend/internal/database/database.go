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
	"time"
)

var DB *sql.DB

func monitorDBStats(logger *log.Logger) {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		stats := DB.Stats()
		logger.Printf("DB Stats - Open: %d, Idle: %d, InUse: %d, WaitCount: %d",
			stats.OpenConnections,
			stats.Idle,
			stats.InUse,
			stats.WaitCount)
	}
}

func InitDB() {
	var err error
	logger := log.New(os.Stdout, "[DB] ", log.LstdFlags|log.Lshortfile)

	possiblePaths := []string{
		"nutrition_data.db",
		"./database/nutrition_data.db",
	}

	var dbPath string
	for _, path := range possiblePaths {
		if _, err := os.Stat(path); !os.IsNotExist(err) {
			dbPath = path
			logger.Printf("Found database at: %s", path)
			break
		}
	}

	if dbPath == "" {
		log.Fatal("Could not find database file in any location")
	}

	DB, err = sql.Open("sqlite3", dbPath)
	if err != nil {
		logger.Fatal("DB connect error:", err)
	}

	DB.SetMaxOpenConns(25)
	DB.SetMaxIdleConns(5)
	DB.SetConnMaxLifetime(5 * time.Minute)

	if err := DB.Ping(); err != nil {
		logger.Fatal("DB ping failed:", err)
	}

	go monitorDBStats(logger)

	logger.Printf("Database connected successfully at: %s", dbPath)
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

func GetRecipe(name string) (config.Recipe, error) {
	var recipe config.Recipe
	err := DB.QueryRow("SELECT id, name, description FROM recipes WHERE name = ?", name).
		Scan(&recipe.ID, &recipe.Name, &recipe.Description)
	if err != nil {
		return recipe, err
	}

	rows, err := DB.Query("SELECT ingredient_name, grams FROM recipe_ingredients WHERE recipe_id = ?", recipe.ID)
	if err != nil {
		return recipe, err
	}
	defer rows.Close()

	for rows.Next() {
		var data config.TemplateIngredient
		if err := rows.Scan(&data.Name, &data.Grams); err == nil {
			recipe.Ingredients = append(recipe.Ingredients, data)
		}
	}
	return recipe, nil
}

func AddRecipe(name, description string, ingredients []config.TemplateIngredient) error {
	tx, err := DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	res, err := tx.Exec("INSERT INTO recipes (name, description) VALUES (?, ?)", name, description)
	if err != nil {
		return err
	}
	recipeID, err := res.LastInsertId()
	if err != nil {
		return err
	}

	stmt, err := tx.Prepare("INSERT INTO recipe_ingredients (recipe_id, ingredient_name, grams) VALUES (?, ?, ?)")
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, ing := range ingredients {
		_, err := stmt.Exec(recipeID, ing.Name, ing.Grams)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

func ListRecipes() ([]config.Recipe, error) {
	rows, err := DB.Query(`
        SELECT r.id, r.name, r.description 
        FROM recipes r 
        ORDER BY r.name ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var recipes []config.Recipe
	for rows.Next() {
		var r config.Recipe
		if err := rows.Scan(&r.ID, &r.Name, &r.Description); err != nil {
			log.Printf("Error scanning recipe: %v", err)
			continue
		}

		ingredients, err := getRecipeIngredients(r.ID)
		if err != nil {
			log.Printf("Error getting ingredients for recipe %s: %v", r.Name, err)
			continue
		}
		r.Ingredients = ingredients
		recipes = append(recipes, r)
	}
	return recipes, nil
}

func getRecipeIngredients(recipeID int) ([]config.TemplateIngredient, error) {
	rows, err := DB.Query(`
        SELECT ingredient_name, grams 
        FROM recipe_ingredients 
        WHERE recipe_id = ?`, recipeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var ingredients []config.TemplateIngredient
	for rows.Next() {
		var ing config.TemplateIngredient
		if err := rows.Scan(&ing.Name, &ing.Grams); err != nil {
			return nil, err
		}
		ingredients = append(ingredients, ing)
	}
	return ingredients, nil
}
