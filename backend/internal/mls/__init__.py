import sys
import json
import argparse
from recommender import RecipeRecommender
from data_processor import load_recipes

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--ingredients', type=str, required=True)
    args = parser.parse_args()
    
    recommender = RecipeRecommender()
    
    recipes = load_recipes()
    recommender.train(recipes)
    
    ingredients = args.ingredients.split(',')
    recommendations = recommender.get_recommendations(ingredients)
    
    print(json.dumps(recommendations))

if __name__ == '__main__':
    main()