# Copyright (c) 2025 @drclcomputers. All rights reserved.
#
# This work is licensed under the terms of the MIT license.
# For a copy, see <https://opensource.org/licenses/MIT>.

import argparse
import sqlite3
import os
from recommender import RecipeRecommender

MODEL_DIR = os.path.join(os.path.dirname(__file__), "model_artifacts")

def load_recipes_from_db(db_path: str):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute("SELECT id, name, description FROM recipes")
    recipe_rows = cursor.fetchall()

    recipes = []
    for recipe_id, name, description in recipe_rows:
        cursor.execute("""
            SELECT ingredient_name
            FROM recipe_ingredients
            WHERE recipe_id = ?
        """, (recipe_id,))
        ingredients = [row[0] for row in cursor.fetchall()]
        recipes.append({"name": name, "description": description, "ingredients": ingredients})

    conn.close()
    return recipes


def main():
    parser = argparse.ArgumentParser(description="Train recommender from SQLite.")
    parser.add_argument("--db", required=True, help="Path to SQLite database.")
    args = parser.parse_args()

    recipes = load_recipes_from_db(args.db)
    recommender = RecipeRecommender()
    recommender.train(recipes)
    recommender.save_model(MODEL_DIR)

    print(f"Model trained and saved to {MODEL_DIR}")

if __name__ == "__main__":
    main()
