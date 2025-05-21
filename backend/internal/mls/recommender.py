# Copyright (c) 2025 @drclcomputers. All rights reserved.
#
# This work is licensed under the terms of the MIT license.
# For a copy, see <https://opensource.org/licenses/MIT>.

import joblib
from typing import List, Dict
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class RecipeRecommender:
    def __init__(self):
        self.vectorizer = TfidfVectorizer()
        self.recipe_vectors = None
        self.recipes_data = []

    def train(self, recipes: List[Dict]):
        self.recipes_data = recipes
        ingredients_text = []

        for r in recipes:
            ing_list = r.get("ingredients")
            if isinstance(ing_list, list):
                ingredients_text.append(" ".join(str(ing) for ing in ing_list))
            else:
                ingredients_text.append("")

        self.recipe_vectors = self.vectorizer.fit_transform(ingredients_text)

    def save_model(self, directory_path: str, filename: str = "recommender_model.joblib"):
        import os
        if not os.path.exists(directory_path):
            os.makedirs(directory_path)

        filepath = os.path.join(directory_path, filename)
        try:
            model_components = {
                "vectorizer": self.vectorizer,
                "recipe_vectors": self.recipe_vectors,
                "recipes_data": self.recipes_data,
            }
            joblib.dump(model_components, filepath)
        except Exception as e:
            raise IOError(f"Error saving model to {filepath}: {e}")

    def load_model(self, filepath: str):
        try:
            model_components = joblib.load(filepath)
            self.vectorizer = model_components["vectorizer"]
            self.recipe_vectors = model_components["recipe_vectors"]
            self.recipes_data = model_components["recipes_data"]
        except FileNotFoundError:
            raise FileNotFoundError(f"Model file not found at {filepath}")
        except Exception as e:
            raise IOError(f"Error loading model from {filepath}: {e}")

    def get_recommendations(self, available_ingredients: List[str], top_k: int = 5):
        if not available_ingredients:
            return []

        top_k = max(1, top_k)

        query_vector = self.vectorizer.transform(
            [" ".join(str(ing) for ing in available_ingredients)]
        )

        similarities = cosine_similarity(query_vector, self.recipe_vectors).flatten()

        num_recipes = self.recipe_vectors.shape[0]
        actual_top_k = min(top_k, num_recipes)

        if actual_top_k == 0:
            return []

        top_indices = similarities.argsort()[-actual_top_k:][::-1]
        recommended = []

        for idx in top_indices:
            recipe = self.recipes_data[idx]
            missing_ingredients = list(
                set(map(str, recipe["ingredients"])) - set(map(str, available_ingredients))
            )
            recommended.append({
                "name": recipe.get("name", ""),
                "description": recipe.get("description", ""),  
                "ingredients": [
                    {"name": ing["name"] if isinstance(ing, dict) and "name" in ing else str(ing)}
                    for ing in recipe.get("ingredients", [])
                ],
                "missing_ingredients": missing_ingredients,
                "similarity": float(similarities[idx])
            })

        return recommended
