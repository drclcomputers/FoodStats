import sys
import json
import argparse
import os
from recommender import RecipeRecommender

MODEL_FILENAME = "recommender_model.joblib"
MODEL_PATH = os.path.join(os.path.dirname(__file__), "model_artifacts", MODEL_FILENAME)

def main():
    parser = argparse.ArgumentParser(description="Get recipe recommendations.")
    parser.add_argument(
        "--ingredients",
        type=str,
        required=True,
        help="Comma-separated list of available ingredients.",
    )
    parser.add_argument(
        "--top_k",
        type=int,
        default=5,
        help="Number of top recommendations to return.",
    )
    args = parser.parse_args()

    recommender = RecipeRecommender()

    if not os.path.exists(MODEL_PATH):
        print(json.dumps({"error": f"Model not found at {MODEL_PATH}."}))
        sys.exit(0)

    try:
        recommender.load_model(MODEL_PATH)
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(0)

    ingredients = [ing.strip() for ing in args.ingredients.split(",") if ing.strip()]
    if not ingredients:
        print(json.dumps({"error": "No valid ingredients provided."}))
        sys.exit(0)

    try:
        recommendations = recommender.get_recommendations(ingredients, args.top_k)
        print(json.dumps(recommendations, indent=2))
    except Exception as e:
        print(json.dumps({"error": f"Error getting recommendations: {str(e)}"}))
        sys.exit(0)

if __name__ == '__main__':
    main()
