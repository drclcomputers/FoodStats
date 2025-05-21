// Copyright (c) 2025 @drclcomputers. All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

package database

import (
	"FoodStats/internal/config"
	"database/sql"
	"fmt"
	"log"
	"os"
	"time"

	_ "github.com/mattn/go-sqlite3"
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

func InitDB() error {
	var err error
	logger := log.New(os.Stdout, "[DB] ", log.LstdFlags|log.Lshortfile)

	possiblePaths := []string{
		"nutrition_data.db",
		"./database/nutrition_data.db",
		"./internal/database/nutrition_data.db",
		"./backend/database/nutrition_data.db",
		"./resources/backend/database/nutrition_data.db",
		"../backend/database/nutrition_data.db",
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
		return err
	}

	DB.SetMaxOpenConns(25)
	DB.SetMaxIdleConns(10)
	DB.SetConnMaxLifetime(5 * time.Minute)
	DB.SetConnMaxIdleTime(2 * time.Minute)

	for attempts := 1; attempts <= 4; attempts++ {
		err = DB.Ping()
		if err == nil {
			break
		}
		logger.Printf("DB connection attempt %d failed: %v", attempts, err)
		time.Sleep(time.Second * 2)
	}

	if err != nil {
		logger.Fatal("Failed to connect to database after 4 attempts:", err)
		return err
	}

	go monitorDBStats(logger)

	logger.Printf("Database connected successfully at: %s", dbPath)
	return nil
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
		var name string
		if err := rows.Scan(&name); err != nil {
			log.Printf("Error scanning ingredient: %v", err)
			continue
		}
		list = append(list, config.Ingredient{
			TemplateIngredient: config.TemplateIngredient{
				Name: name,
			},
		})
	}
	return list
}

func GetRecipe(name string) (config.Recipe, error) {
	var recipe config.Recipe
	err := DB.QueryRow("SELECT id, name, description, vegan FROM recipes WHERE name = ?", name).
		Scan(&recipe.ID, &recipe.Name, &recipe.Description, &recipe.Vegan)
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
			recipe.Ingredients = append(recipe.Ingredients, config.Ingredient{
				TemplateIngredient: data,
			})
		}
	}
	return recipe, nil
}

func AddRecipe(name, description string, ingredients []config.TemplateIngredient) error {
	if !ValidateIngredientName(name) {
		return fmt.Errorf("invalid recipe name")
	}

	sanitizedDesc := SanitizeDescription(description)
	if len(sanitizedDesc) > 500 {
		return fmt.Errorf("description too long")
	}

	tx, err := DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	stmt, err := tx.Prepare("INSERT INTO recipes (name, description) VALUES (?, ?)")
	if err != nil {
		return err
	}
	defer stmt.Close()

	res, err := stmt.Exec(name, sanitizedDesc)
	if err != nil {
		return err
	}

	recipeID, err := res.LastInsertId()
	if err != nil {
		return err
	}

	ingredientStmt, err := tx.Prepare("INSERT INTO recipe_ingredients (recipe_id, ingredient_name, grams) VALUES (?, ?, ?)")
	if err != nil {
		return err
	}
	defer ingredientStmt.Close()

	for _, ing := range ingredients {
		if !ValidateIngredientName(ing.Name) {
			return fmt.Errorf("invalid ingredient name: %s", ing.Name)
		}
		if !ValidateGrams(ing.Grams) {
			return fmt.Errorf("invalid grams amount for %s", ing.Name)
		}

		_, err := ingredientStmt.Exec(recipeID, ing.Name, ing.Grams)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

func ListRecipes() ([]config.Recipe, error) {
	rows, err := DB.Query(`
        SELECT r.id, r.name, r.description, r.vegan
        FROM recipes r 
        ORDER BY r.name ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var recipes []config.Recipe
	for rows.Next() {
		var r config.Recipe
		if err := rows.Scan(&r.ID, &r.Name, &r.Description, &r.Vegan); err != nil {
			log.Printf("Error scanning recipe: %v", err)
			continue
		}

		ingredients, err := getRecipeIngredients(r.ID)
		if err != nil {
			log.Printf("Error getting ingredients for recipe %s: %v", r.Name, err)
			continue
		}
		//r.Ingredients = ingredients

		var ingredientList []config.Ingredient
		for _, ing := range ingredients {
			ingredientList = append(ingredientList, config.Ingredient{
				TemplateIngredient: ing.TemplateIngredient,
			})
		}
		r.Ingredients = ingredientList

		recipes = append(recipes, r)
	}
	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating recipe rows: %w", err)
	}
	return recipes, nil
}

func getRecipeIngredients(recipeID int) ([]config.Ingredient, error) {
	query := `
        SELECT 
            ri.ingredient_name, 
            ri.grams, 
            i.CALORIES, 
            i.PROTEINS, 
            i.CARBS, 
            i.FATS, 
            i.FIBER 
        FROM recipe_ingredients ri
        JOIN ingredients i ON LOWER(ri.ingredient_name) = LOWER(i.NAME)
        WHERE ri.recipe_id = ?`

	rows, err := DB.Query(query, recipeID)
	if err != nil {
		return nil, fmt.Errorf("querying recipe ingredients failed: %w", err)
	}
	defer rows.Close()

	var ingredients []config.Ingredient
	for rows.Next() {
		var ingName string
		var ingGrams float64
		var baseCalories, baseProteins, baseCarbs, baseFats, baseFiber float64 // Per 100g

		if err := rows.Scan(&ingName, &ingGrams, &baseCalories, &baseProteins, &baseCarbs, &baseFats, &baseFiber); err != nil {
			return nil, fmt.Errorf("scanning recipe ingredient failed: %w", err)
		}

		ingredients = append(ingredients, config.Ingredient{
			TemplateIngredient: config.TemplateIngredient{
				Name:  ingName,
				Grams: ingGrams,
			},
			NutritionalInfo: config.NutritionalInfo{
				Calories: ingGrams * baseCalories / 100,
				Proteins: ingGrams * baseProteins / 100,
				Carbs:    ingGrams * baseCarbs / 100,
				Fats:     ingGrams * baseFats / 100,
				Fiber:    ingGrams * baseFiber / 100,
			},
		})
	}
	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("rows iteration error for recipe ingredients: %w", err)
	}
	return ingredients, nil
}
