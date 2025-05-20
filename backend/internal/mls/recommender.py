from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from typing import List, Dict
import math

class RecipeRecommender:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(stop_words='english')
        self.recipe_vectors = None
        self.recipes = []

    def train(self, recipes: List[Dict]):
        self.recipes = recipes
        ingredients_text = [' '.join(r['ingredients']) for r in recipes]
        self.recipe_vectors = self.vectorizer.fit_transform(ingredients_text)

    def _get_missing_ingredients(self, available_ingredients, recipe_ingredients):
        """
        Returns a list of ingredients in the recipe that are not in the available ingredients.
        """
        available_set = set([ing.strip().lower() for ing in available_ingredients])
        recipe_set = set([ing.strip().lower() for ing in recipe_ingredients])
        return list(recipe_set - available_set)

    def get_recommendations(self, available_ingredients: List[str], top_k: int = 6) -> List[Dict]:
        if self.recipe_vectors is None or not self.recipes:
            return []
        query_vector = self.vectorizer.transform([' '.join(available_ingredients)])
        similarities = cosine_similarity(query_vector, self.recipe_vectors).flatten()
        top_indices = similarities.argsort()[-top_k:][::-1]
        results = []
        for i in top_indices:
            sim = float(similarities[i])
            if sim > 0 and not math.isnan(sim):
                recipe = self.recipes[i]
                results.append({
                    "name": recipe.get("name", ""),
                    "description": recipe.get("description", ""),
                    "similarity": round(sim, 2),
                })
        return results