import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

class IngredientSubstituter:
    def __init__(self, ingredient_embeddings: Dict[str, np.ndarray]):
        self.embeddings = ingredient_embeddings
        self.nutrition_db = self._load_nutrition_database()

    def find_substitutes(self, ingredient: str, num_subs: int = 3) -> List[Dict]:
        if ingredient not in self.embeddings:
            return []
            
        similarities = {
            ing: cosine_similarity(
                [self.embeddings[ingredient]], 
                [self.embeddings[ing]]
            )[0][0]
            for ing in self.embeddings
            if ing != ingredient
        }
        
        top_subs = sorted(similarities.items(), key=lambda x: x[1], reverse=True)[:num_subs]
        
        return [
            {
                'ingredient': sub[0],
                'similarity': float(sub[1]),
                'nutrition_match': self._compare_nutrition(ingredient, sub[0])
            }
            for sub in top_subs
        ]