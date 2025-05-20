import sys
import json
import argparse
from typing import List, Dict
import sys
import numpy as np
from sklearn.preprocessing import MinMaxScaler

def analyze_nutrition(ingredients: List[Dict]) -> Dict:
    total_calories = sum(ing.get('calories', 0) for ing in ingredients)
    total_proteins = sum(ing.get('proteins', 0) for ing in ingredients)
    total_carbs = sum(ing.get('carbs', 0) for ing in ingredients)
    total_fats = sum(ing.get('fats', 0) for ing in ingredients)
    total_fiber = sum(ing.get('fiber', 0) for ing in ingredients)
    
    metrics = {
        'protein_ratio': min(total_proteins * 4 / total_calories if total_calories > 0 else 0, 1) * 30,
        'fiber_score': min(total_fiber / 30, 1) * 20,
        'fat_balance': (1 - abs(0.3 - (total_fats * 9 / total_calories if total_calories > 0 else 0))) * 25,
        'carb_balance': (1 - abs(0.5 - (total_carbs * 4 / total_calories if total_calories > 0 else 0))) * 25
    }
    
    health_score = sum(metrics.values())
    
    recommendations = []
    
    if total_proteins < 20:
        recommendations.append("Add lean protein sources like chicken, fish, or legumes")
    elif total_proteins > 100:
        recommendations.append("Consider reducing protein intake to maintain balance")
        
    carb_ratio = total_carbs * 4 / total_calories if total_calories > 0 else 0
    if carb_ratio < 0.4:
        recommendations.append("Include more complex carbohydrates for sustained energy")
    elif carb_ratio > 0.7:
        recommendations.append("Reduce carbohydrate ratio for better macronutrient balance")
        
    fat_ratio = total_fats * 9 / total_calories if total_calories > 0 else 0
    if fat_ratio < 0.2:
        recommendations.append("Include healthy fats from nuts, avocados, or olive oil")
    elif fat_ratio > 0.35:
        recommendations.append("Consider reducing fat intake for heart health")
        
    if total_fiber < 25:
        recommendations.append("Increase fiber intake with whole grains and vegetables")
    
    optimal_ranges = {
        "Proteins": [0.25, 0.35],
        "Carbs": [0.45, 0.65],
        "Fats": [0.20, 0.35]
    }
    
    total = total_proteins + total_carbs + total_fats
    if total > 0:
        nutrient_balance = {
            "Proteins": total_proteins / total,
            "Carbs": total_carbs / total,
            "Fats": total_fats / total
        }
    else:
        nutrient_balance = {"Proteins": 0, "Carbs": 0, "Fats": 0}
    
    nutrient_scores = {}
    for nutrient, value in nutrient_balance.items():
        optimal_min, optimal_max = optimal_ranges[nutrient]
        if value < optimal_min:
            score = value / optimal_min
        elif value > optimal_max:
            score = 1 - ((value - optimal_max) / (1 - optimal_max))
        else:
            score = 1.0
        nutrient_scores[nutrient] = round(score, 2)
    
    return {
        "health_score": round(health_score, 1),
        "recommendations": recommendations,
        "nutrient_balance": nutrient_balance,
        "nutrient_scores": nutrient_scores,
        "metrics_breakdown": metrics
    }

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--data', type=str, required=False)
    parser.add_argument('--file', type=str, required=False)
    args = parser.parse_args()

    if args.file:
        with open(args.file, 'r', encoding='utf-8') as f:
            ingredients = json.load(f)
    elif args.data:
        ingredients = json.loads(args.data)
    else:
        print("No input data provided", file=sys.stderr)
        sys.exit(1)

    result = analyze_nutrition(ingredients)
    print(json.dumps(result))

if __name__ == '__main__':
    main()