# Copyright (c) 2025 @drclcomputers. All rights reserved.
#
# This work is licensed under the terms of the MIT license.
# For a copy, see <https://opensource.org/licenses/MIT>.

import json
import os
from analyzer import analyze_nutrition

# Test recipes with varied nutritional profiles
test_recipes = [
    {
        "name": "Balanced Chicken Salad",
        "description": "A nutritionally balanced chicken salad with vegetables and healthy fats",
        "ingredients": [
            {"name": "chicken breast", "grams": 150, "calories": 165, "proteins": 31, "carbs": 0, "fats": 3.6, "fiber": 0},
            {"name": "mixed greens", "grams": 100, "calories": 25, "proteins": 2, "carbs": 5, "fats": 0.3, "fiber": 3},
            {"name": "olive oil", "grams": 15, "calories": 120, "proteins": 0, "carbs": 0, "fats": 14, "fiber": 0},
            {"name": "cherry tomatoes", "grams": 50, "calories": 15, "proteins": 0.5, "carbs": 3, "fats": 0.2, "fiber": 1},
            {"name": "avocado", "grams": 50, "calories": 80, "proteins": 1, "carbs": 4, "fats": 7.5, "fiber": 3.5}
        ]
    },
    {
        "name": "Carb-Heavy Pasta",
        "description": "A high-carbohydrate pasta dish with minimal protein",
        "ingredients": [
            {"name": "pasta", "grams": 200, "calories": 280, "proteins": 10, "carbs": 56, "fats": 2, "fiber": 3},
            {"name": "tomato sauce", "grams": 150, "calories": 75, "proteins": 3, "carbs": 15, "fats": 1, "fiber": 3},
            {"name": "garlic", "grams": 10, "calories": 15, "proteins": 0.5, "carbs": 3, "fats": 0, "fiber": 0.2},
            {"name": "olive oil", "grams": 30, "calories": 240, "proteins": 0, "carbs": 0, "fats": 28, "fiber": 0}
        ]
    },
    {
        "name": "Protein Smoothie",
        "description": "A protein-rich post-workout smoothie",
        "ingredients": [
            {"name": "protein powder", "grams": 30, "calories": 110, "proteins": 24, "carbs": 3, "fats": 1, "fiber": 0},
            {"name": "banana", "grams": 100, "calories": 90, "proteins": 1, "carbs": 23, "fats": 0.3, "fiber": 2.6},
            {"name": "milk", "grams": 250, "calories": 125, "proteins": 8, "carbs": 12, "fats": 5, "fiber": 0},
            {"name": "peanut butter", "grams": 15, "calories": 90, "proteins": 4, "carbs": 3, "fats": 7.5, "fiber": 1}
        ]
    }
]

# Test each recipe with the analyzer
def testrecipes():
    results = []
    
    for recipe in test_recipes:
        print(f"\n--- Analyzing: {recipe['name']} ---")
        analysis = analyze_nutrition(recipe["ingredients"])
        
        print(f"Health Score: {analysis['health_score']}")
        print(f"Recommendations: {analysis['recommendations']}")
        print(f"Nutrient Balance:")
        for nutrient, value in analysis['nutrient_balance'].items():
            print(f"  - {nutrient}: {value*100:.1f}%")
        
        results.append({
            "recipe": recipe["name"],
            "analysis": analysis
        })
    
    return results

if __name__ == "__main__":
    results = testrecipes()
    
    output_file = os.path.join(os.path.dirname(__file__), "analysis_results.json")
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
        
    print(f"\nResults saved to {output_file}")